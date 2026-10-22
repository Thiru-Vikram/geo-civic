package backend.geocivic.controller;

import backend.geocivic.dto.ChatRequest;
import backend.geocivic.dto.ChatResponse;
import backend.geocivic.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    /**
     * Handles all incoming citizen chat messages.
     *
     * @param request JSON body with "message" and optional "userId".
     * @return JSON body with "reply" from GeoBot.
     */
    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {

        // Basic validation
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            log.warn("ChatController: empty message received");
            return ResponseEntity.badRequest()
                    .body(new ChatResponse("Please type a message before sending."));
        }

        // Log interaction for auditing (message is truncated for privacy)
        String preview = request.getMessage().length() > 80
                ? request.getMessage().substring(0, 80) + "..."
                : request.getMessage();
        log.info("ChatController: userId={} sent message: '{}'", request.getUserId(), preview);

        // Delegate to service layer
        String reply = chatService.processMessage(request);

        return ResponseEntity.ok(new ChatResponse(reply));
    }
}
