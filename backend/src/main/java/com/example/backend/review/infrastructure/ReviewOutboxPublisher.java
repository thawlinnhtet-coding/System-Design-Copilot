package com.example.backend.review.infrastructure;

import com.example.backend.review.application.ReviewProcessingProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component @ConditionalOnProperty(prefix="app.review",name="outbox-publisher-enabled",havingValue="true")
class ReviewOutboxPublisher {
	private final ReviewOutboxEventRepository events; private final RabbitTemplate amqp; private final ReviewProcessingProperties properties; private final Clock clock; private final TransactionTemplate transactions;
	ReviewOutboxPublisher(ReviewOutboxEventRepository events,RabbitTemplate amqp,ReviewProcessingProperties properties,Clock clock,org.springframework.transaction.PlatformTransactionManager transactionManager){this.events=events;this.amqp=amqp;this.properties=properties;this.clock=clock;this.transactions=new TransactionTemplate(transactionManager);}
	@Scheduled(fixedDelayString="${REVIEW_OUTBOX_POLL_INTERVAL:5000}") public void publishPending(){var now=Instant.now(clock); for(var event:claimable(now)){var owner=UUID.randomUUID().toString(); if(!claim(event.getId(),owner,now))continue; try{var correlation=new org.springframework.amqp.rabbit.connection.CorrelationData(event.getId().toString()); amqp.convertAndSend("",properties.queueName(),event.getReviewJobId().toString(),correlation); var confirmation=correlation.getFuture().get(10,TimeUnit.SECONDS); if(!confirmation.isAck())throw new IllegalStateException("RabbitMQ did not confirm the review event"); markPublished(event.getId(),owner);}catch(Exception ignored){release(event.getId(),owner);}}
	}
	private java.util.List<ReviewOutboxEventEntity> claimable(Instant now){return transactions.execute(status->events.findClaimable(now));}
	private boolean claim(UUID id,String owner,Instant now){return transactions.execute(status->events.claim(id,owner,now,now.plus(Duration.ofMinutes(2))))==1;}
	private void markPublished(UUID id,String owner){transactions.execute(status->events.markPublished(id,owner,Instant.now(clock)));}
	private void release(UUID id,String owner){transactions.execute(status->events.release(id,owner));}
}
