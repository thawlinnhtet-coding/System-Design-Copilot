package com.example.backend.architecture.api;

import com.example.backend.architecture.application.ArchitectureDocumentService.ArchitectureDocumentConflictException;
import com.example.backend.architecture.application.ArchitectureDocumentService.ArchitectureDocumentMissingException;
import com.example.backend.architecture.application.ArchitectureDocumentService.ArchitectureRevisionNotFoundException;
import com.example.backend.architecture.application.ArchitectureDocumentService.InvalidArchitectureDocumentException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.net.URI;

@RestControllerAdvice
class ArchitectureDocumentProblemAdvice {
	@ExceptionHandler(InvalidArchitectureDocumentException.class) ProblemDetail invalid(InvalidArchitectureDocumentException e) { return problem(HttpStatus.BAD_REQUEST, "invalid_architecture_document", e.getMessage()); }
	@ExceptionHandler(ArchitectureDocumentMissingException.class) ProblemDetail missing(ArchitectureDocumentMissingException e) { return problem(HttpStatus.CONFLICT, "architecture_document_missing", e.getMessage()); }
	@ExceptionHandler(ArchitectureRevisionNotFoundException.class) ProblemDetail revisionNotFound(ArchitectureRevisionNotFoundException e) { return problem(HttpStatus.NOT_FOUND, "architecture_revision_not_found", e.getMessage()); }
	@ExceptionHandler(ArchitectureDocumentConflictException.class) ProblemDetail conflict(ArchitectureDocumentConflictException e) { var p=problem(HttpStatus.CONFLICT,"architecture_document_conflict",e.getMessage()); p.setProperty("currentVersion", e.currentVersion()); p.setProperty("currentDocument", e.currentDocument()); return p; }
	private ProblemDetail problem(HttpStatus status, String code, String detail) { var p=ProblemDetail.forStatusAndDetail(status,detail); p.setType(URI.create("https://system-design-copilot.dev/problems/"+code)); p.setProperty("code",code); return p; }
}
