package com.example.backend.review.infrastructure;

import com.example.backend.review.application.ReviewService;
import com.example.backend.review.application.ReviewProcessingProperties;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Component @ConditionalOnProperty(prefix="app.review",name="worker-enabled",havingValue="true")
class ReviewWorker {
	private final ReviewService service; private final AmqpTemplate amqp; private final ReviewProcessingProperties properties;
	ReviewWorker(ReviewService service,AmqpTemplate amqp,ReviewProcessingProperties properties){this.service=service;this.amqp=amqp;this.properties=properties;}
	@RabbitListener(queues="${app.review.queue-name}") public void process(String body){var outcome=service.process(UUID.fromString(body),"rabbit-review-worker");if(outcome==ReviewService.ProcessingOutcome.RETRY)amqp.convertAndSend(properties.queueName(),body);else if(outcome==ReviewService.ProcessingOutcome.FAILED)amqp.convertAndSend(properties.deadLetterQueueName(),body);}
}
