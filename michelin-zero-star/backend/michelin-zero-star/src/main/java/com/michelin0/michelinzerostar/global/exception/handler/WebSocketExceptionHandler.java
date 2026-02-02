package com.michelin0.michelinzerostar.global.exception.handler;

import com.michelin0.michelinzerostar.global.exception.response.ErrorResponse;
import java.net.SocketException;
import java.net.http.HttpResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.Message;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Slf4j
public class WebSocketExceptionHandler {

//    private final CustomWebSocketHandlerDecorator decorator;
//
//    @MessageExceptionHandler(SocketException.class)
//    @SendToUser("/queue/errors")
//    public ResponseEntity<ErrorResponse> handleSocketException(Message<?> message){
//        removeSession(message);
//    }
//
//    private void removeSession(Message<?> message) {
//        StompHeaderAccessor stompHeaderAccessor= StompHeaderAccessor.wrap(message);
//        String sessionId= stompHeaderAccessor.getSessionId();
//        log.info("Session= {}, connection remove", sessionId);
//        decorator.closeSession(sessionId);
//    }
}
