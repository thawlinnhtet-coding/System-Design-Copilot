package com.example.backend.review.application;

public enum ReviewJobStatus {
	QUEUED,
	PROCESSING,
	RETRYING,
	DEAD_LETTERED,
	COMPLETED
}
