ALTER TABLE challenge_versions ADD COLUMN scenario_arc JSONB NOT NULL DEFAULT '[]';

UPDATE challenge_versions SET scenario_arc = '[
  {"title":"Viral redirect traffic","changedCondition":"Redirect traffic rises 20x after a link goes viral.","details":"Cache misses now concentrate on a small set of links while the redirect path must remain fast. What changes first, and why?","category":"GROWTH_SCALE"},
  {"title":"Persistence region failure","changedCondition":"The primary link-persistence region becomes unavailable.","details":"Existing links must remain recoverable while writes and redirects encounter a regional failure. Explain the failure behavior and recovery trade-off.","category":"FAILURE_RELIABILITY"},
  {"title":"Malicious link abuse","changedCondition":"A client creates high-volume malicious links and redirect traffic.","details":"The system needs to protect users and the redirect path without treating every legitimate creator as hostile. What controls and evidence change?","category":"SECURITY"}
]' WHERE id = '11111111-1111-4111-8111-111111111112';

UPDATE challenge_versions SET scenario_arc = '[
  {"title":"Celebrity fan-out surge","changedCondition":"A celebrity post creates a sharp read surge.","details":"The feed is read heavily while a single publisher now fans out to millions of followers. What scales, and what stays bounded?","category":"GROWTH_SCALE"},
  {"title":"Feed worker lag","changedCondition":"Feed workers fall behind for ten minutes.","details":"Delivery lag grows while new posts continue arriving. Explain how the system recovers without losing ordering and visibility guarantees.","category":"FAILURE_RELIABILITY"},
  {"title":"Freshness and privacy change","changedCondition":"A post changes visibility after fan-out.","details":"A privacy change must reach already-materialized feeds. What data or invalidation path changes, and what uncertainty remains?","category":"PRODUCT_CHANGE"}
]' WHERE id = '22222222-2222-4222-8222-222222222223';

UPDATE challenge_versions SET scenario_arc = '[
  {"title":"Flash-sale concurrency","changedCondition":"A flash sale causes extreme contention for a small group of seats.","details":"Demand jumps sharply while inventory cannot be oversold. What becomes the ownership and admission path?","category":"GROWTH_SCALE"},
  {"title":"Reservation and payment failure","changedCondition":"Payment succeeds but the booking response times out.","details":"The customer may retry while the reservation state is uncertain. Explain recovery without overselling or double-charging.","category":"FAILURE_RELIABILITY"},
  {"title":"Hold expiry reconciliation","changedCondition":"Hold expiry races with cancellation and refund processing.","details":"External payment state and inventory state may disagree. What reconciliation and audit trail are required?","category":"CONSISTENCY"}
]' WHERE id = '33333333-3333-4333-8333-333333333334';

UPDATE challenge_versions SET scenario_arc = '[
  {"title":"Campaign delivery burst","changedCondition":"A campaign creates a sudden notification burst.","details":"Delivery demand grows beyond normal provider capacity. What gets isolated and how is backlog made visible?","category":"GROWTH_SCALE"},
  {"title":"Provider failures","changedCondition":"A provider returns intermittent 5xx responses.","details":"Retrying blindly can amplify the outage. What retry, fallback, and observability behavior changes?","category":"FAILURE_RELIABILITY"},
  {"title":"Preference change during delivery","changedCondition":"A user disables a channel while a notification is queued.","details":"The queued intent conflicts with a newer user preference. What is checked, when, and with what audit evidence?","category":"PRODUCT_CHANGE"}
]' WHERE id = '44444444-4444-4444-8444-444444444445';

UPDATE challenge_versions SET scenario_arc = '[
  {"title":"Retry storm","changedCondition":"A retry storm exhausts worker capacity.","details":"Queued jobs accumulate while repeated failures consume shared resources. What admission and backpressure changes first?","category":"GROWTH_SCALE"},
  {"title":"Lost worker lease","changedCondition":"A worker disappears while holding a lease.","details":"A long-running job may still be executing when a replacement starts. Explain recovery and idempotency boundaries.","category":"FAILURE_RELIABILITY"},
  {"title":"Acknowledgement race","changedCondition":"A job completes while its acknowledgement times out.","details":"The result may be applied more than once. What durable state and reconciliation behavior changes?","category":"CONSISTENCY"}
]' WHERE id = '55555555-5555-4555-8555-555555555556';

UPDATE challenge_versions SET scenario_arc = '[
  {"title":"Burst at regional boundaries","changedCondition":"Traffic rises sharply across several regions at once.","details":"Admission decisions must remain predictable under a multi-region burst. What coordination becomes hot, and what stays local?","category":"GROWTH_SCALE"},
  {"title":"Coordination-store outage","changedCondition":"A region loses connectivity to the coordination store.","details":"Rate-limit decisions still need a deliberate failure mode. Explain fail-open or fail-closed behavior and recovery evidence.","category":"FAILURE_RELIABILITY"},
  {"title":"Plan limit changes during a burst","changedCondition":"A customer changes plan limits while traffic is already in flight.","details":"New entitlements and distributed counters can disagree briefly. What consistency and customer-facing behavior changes?","category":"CONSISTENCY"}
]' WHERE id = '66666666-6666-4666-8666-666666666667';
