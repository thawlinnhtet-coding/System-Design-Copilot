package com.example.backend.review.infrastructure;

import com.example.backend.review.application.ReviewProcessingProperties;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.time.Instant;

@Component @ConditionalOnProperty(prefix="app.review",name="outbox-publisher-enabled",havingValue="true")
class ReviewOutboxPublisher {
	private final ReviewOutboxEventRepository events; private final AmqpTemplate amqp; private final ReviewProcessingProperties properties; private final Clock clock;
	ReviewOutboxPublisher(ReviewOutboxEventRepository events,AmqpTemplate amqp,ReviewProcessingProperties properties,Clock clock){this.events=events;this.amqp=amqp;this.properties=properties;this.clock=clock;}
	@Scheduled(fixedDelayString="${REVIEW_OUTBOX_POLL_INTERVAL:5000}") @Transactional public void publishPending(){for(var event:events.findTop50ByStatusOrderByCreatedAtAsc("PENDING")){try{amqp.convertAndSend(properties.queueName(),event.getReviewJobId().toString());event.published(Instant.now(clock));}catch(RuntimeException ignored){return;}}}
}
