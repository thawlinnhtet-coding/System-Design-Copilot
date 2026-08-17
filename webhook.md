stripe listen --events "customer.subscription.created,customer.subscription.updated,customer.subscription.deleted" --forward-to "http://localhost:8080/api/v1/webhooks/stripe"

clerk jwt token
const token = await window.Clerk.session.getToken({
template: "system-design-copilot-api"
});

console.log(token ? "Token created" : "No token");

copy(token);
