package com.example.backend.review.infrastructure;

import com.example.backend.review.application.ReviewProcessingProperties;
import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Configuration @ConditionalOnProperty(prefix="app.review",name="worker-enabled",havingValue="true")
class ReviewMessagingConfiguration {
	@Bean Queue reviewProcessingQueue(ReviewProcessingProperties properties){return new Queue(properties.queueName(),true,false,false,java.util.Map.of("x-dead-letter-exchange","","x-dead-letter-routing-key",properties.deadLetterQueueName()));}
	@Bean Queue reviewDeadLetterQueue(ReviewProcessingProperties properties){return new Queue(properties.deadLetterQueueName(),true);}
}
