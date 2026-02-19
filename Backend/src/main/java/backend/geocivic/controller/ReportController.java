package backend.geocivic.controller;

import backend.geocivic.model.*;
import backend.geocivic.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class ReportController {

    @Autowired
    private ReportRepository reportRepository;
    @Autowired
    private ReportUpdateRepository reportUpdateRepository;
    @Autowired
    private ReportVoteRepository reportVoteRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private NotificationRepository notificationRepository;

    private final String UPLOAD_DIR = "./uploads/";

    // ── GET all reports (Admin sees everything) ────────────────────────────────
    @GetMapping
    public List<Report> getAllReports() {
        return reportRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Report> getReportById(@PathVariable Long id) {
        return reportRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── GET reports by user ───────────────────────────────────────────────────
    @GetMapping("/user/{userId}")
    public List<Report> getReportsByUser(@PathVariable Long userId) {
        return reportRepository.findByUserId(userId);
    }

    // ── GET reports assigned to a specific staff member ───────────────────────
    @GetMapping("/staff/{staffId}")
    public List<Report> getReportsByStaff(@PathVariable Long staffId) {
        return reportRepository.findByAssignedStaffId(staffId);
    }

    // ── CREATE report (User) ──────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> createReport(
            @RequestParam("title") String title,
            @RequestParam("location") String location,
            @RequestParam("description") String description,
            @RequestParam("category") String category,
            @RequestParam("userId") Long userId,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null)
                return ResponseEntity.badRequest().body("User not found");

            Report report = new Report(title, location, description, category, user);
            report.setLatitude(latitude);
            report.setLongitude(longitude);

            if (image != null && !image.isEmpty()) {
                String fileName = saveFile(image);
                report.setImagePath("/uploads/" + fileName);
            }

            Report savedReport = reportRepository.save(report);
            notificationRepository.save(new Notification(user,
                    "New report '" + title + "' submitted successfully! Our team will review it."));
            return ResponseEntity.ok(savedReport);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Error saving image: " + e.getMessage());
        }
    }

    // ── ADMIN: Assign report to staff + set In Progress ───────────────────────
    @PutMapping("/{id}/assign")
    public ResponseEntity<?> assignToStaff(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Long staffId = Long.parseLong(payload.get("staffId").toString());
        String staffName = payload.get("staffName").toString();

        return reportRepository.findById(id).map(report -> {
            report.setAssignedStaffId(staffId);
            report.setAssignedAgentName(staffName);
            report.setStatus("Progress");
            Report saved = reportRepository.save(report);

            // Notify the citizen
            notificationRepository.save(new Notification(report.getUser(),
                    "Your report '" + report.getTitle() + "' is now In Progress. Assigned agent: " + staffName + "."));

            // Notify the staff
            User staff = userRepository.findById(staffId).orElse(null);
            if (staff != null) {
                notificationRepository.save(new Notification(staff,
                        "You've been assigned to report TKT-" + String.format("%03d", report.getId()) + ": '"
                                + report.getTitle() + "'."));
            }

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── STAFF: Resolve with proof photo + GPS coords ──────────────────────────
    @PutMapping("/{id}/resolve")
    public ResponseEntity<?> resolveReport(
            @PathVariable Long id,
            @RequestParam("staffLat") Double staffLat,
            @RequestParam("staffLng") Double staffLng,
            @RequestParam(value = "proofImage", required = false) MultipartFile proofImage) {

        return reportRepository.findById(id).map(report -> {
            // Validate that staff is within 200m of the issue
            if (report.getLatitude() != null && report.getLongitude() != null) {
                double distMeters = haversineDistance(
                        report.getLatitude(), report.getLongitude(), staffLat, staffLng);
                if (distMeters > 200) {
                    return ResponseEntity.badRequest()
                            .body("Location mismatch! You are " + Math.round(distMeters)
                                    + "m away from the issue. Move closer to resolve.");
                }
            }

            // Save proof image
            if (proofImage != null && !proofImage.isEmpty()) {
                try {
                    String fileName = saveFile(proofImage);
                    report.setProofImagePath("/uploads/" + fileName);
                } catch (IOException e) {
                    return ResponseEntity.internalServerError().body("Error saving proof image.");
                }
            }

            report.setResolvedLatitude(staffLat);
            report.setResolvedLongitude(staffLng);
            report.setStatus("PendingVerification");
            Report saved = reportRepository.save(report);

            // Log update
            reportUpdateRepository.save(new ReportUpdate(report, "PendingVerification",
                    "Staff has fixed the issue and uploaded proof. Awaiting citizen verification."));

            // Notify the citizen
            notificationRepository.save(new Notification(report.getUser(),
                    "Great news! Your report '" + report.getTitle()
                            + "' has been resolved. Please go to the location and verify!"));

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── USER: Verify & resolve ticket (with optional GPS check) ───────────────
    @PutMapping("/{id}/verify")
    public ResponseEntity<?> verifyReport(
            @PathVariable Long id,
            @RequestParam(value = "userLat", required = false) Double userLat,
            @RequestParam(value = "userLng", required = false) Double userLng) {

        return reportRepository.findById(id).map(report -> {
            // Validate user is within 200m of the issue (only if coords provided and report
            // has coords)
            if (userLat != null && userLng != null && report.getLatitude() != null && report.getLongitude() != null) {
                double distMeters = haversineDistance(
                        report.getLatitude(), report.getLongitude(), userLat, userLng);
                if (distMeters > 200) {
                    return ResponseEntity.badRequest()
                            .body("You must be at the issue location to verify. You are " + Math.round(distMeters)
                                    + "m away.");
                }
            }

            report.setIsVerified(true);
            report.setStatus("Resolved");
            Report saved = reportRepository.save(report);

            // Award coins (null-safe for users created before civic_coins column)
            User user = report.getUser();
            int currentCoins = user.getCivicCoins() != null ? user.getCivicCoins() : 0;
            user.setCivicCoins(currentCoins + 50);
            userRepository.save(user);

            reportUpdateRepository.save(
                    new ReportUpdate(report, "Resolved", "Citizen verified the fix at the location. Issue resolved!"));
            notificationRepository.save(new Notification(user,
                    "You've verified TKT-" + String.format("%03d", report.getId())
                            + " and earned 50 CC! Issue is now officially Resolved."));

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Update status (admin general) ─────────────────────────────────────────
    @PutMapping("/{id}/status")
    public ResponseEntity<Report> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        String comment = payload.get("comment");

        return reportRepository.findById(id).map(report -> {
            report.setStatus(status);
            Report savedReport = reportRepository.save(report);
            reportUpdateRepository.save(new ReportUpdate(report, status, comment));
            notificationRepository.save(new Notification(report.getUser(),
                    "Your report '" + report.getTitle() + "' status changed to " + status));
            return ResponseEntity.ok(savedReport);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Vote on report ────────────────────────────────────────────────────────
    @PostMapping("/{id}/vote")
    public ResponseEntity<?> voteReport(@PathVariable Long id, @RequestParam Long userId) {
        return reportRepository.findById(id).map(report -> {
            boolean alreadyVoted = reportVoteRepository.findByReportIdAndUserId(id, userId).isPresent();
            if (alreadyVoted)
                return ResponseEntity.badRequest().body("You have already voted.");

            User user = userRepository.findById(userId).orElse(null);
            if (user == null)
                return ResponseEntity.notFound().build();

            reportVoteRepository.save(new ReportVote(report, user));
            report.setUpvoteCount(report.getUpvoteCount() + 1);
            reportRepository.save(report);
            return ResponseEntity.ok(report);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Get update history ────────────────────────────────────────────────────
    @GetMapping("/{id}/updates")
    public List<ReportUpdate> getReportUpdates(@PathVariable Long id) {
        return reportUpdateRepository.findByReportIdOrderByCreatedAtDesc(id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private String saveFile(MultipartFile file) throws IOException {
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath))
            Files.createDirectories(uploadPath);
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Files.copy(file.getInputStream(), uploadPath.resolve(fileName));
        return fileName;
    }

    /**
     * Haversine formula to compute distance in metres between two lat/lng points
     */
    private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000; // Earth radius in metres
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
