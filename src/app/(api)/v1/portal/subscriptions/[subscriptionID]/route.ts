import { stripe } from '@lib/stripe/index';
import { authorizePortal } from '@v1/middleware/authorizePortal';
import { HappinessResponse } from '@v1/responses/HappinessResponse';
import { handleErrors } from '@v1/responses/handleErrors';

export const DELETE = async (
    req: Request,
    { params }: { params: { subscriptionID: string } },
) => {
    try {
        const email = await authorizePortal(req);
        if (!email) {
            return HappinessResponse.json(401, { error: 'Unauthorized' });
        }

        // Look up the Stripe customer by email
        const customers = await stripe.customers.list({ email, limit: 1 });
        if (customers.data.length === 0) {
            return HappinessResponse.json(404, {
                error: 'No Stripe customer found for this account',
            });
        }
        const customer = customers.data[0];

        // Retrieve the subscription
        const subscription = await stripe.subscriptions.retrieve(
            params.subscriptionID,
        );

        // Security: verify the subscription belongs to the authenticated user's customer
        const subscriptionCustomerID =
            typeof subscription.customer === 'string'
                ? subscription.customer
                : subscription.customer.id;

        if (subscriptionCustomerID !== customer.id) {
            return HappinessResponse.json(403, { error: 'Forbidden' });
        }

        // Cancel at period end
        const updated = await stripe.subscriptions.update(
            params.subscriptionID,
            { cancel_at_period_end: true },
        );

        return HappinessResponse.json(200, {
            data: {
                subscriptionID: updated.id,
                cancelAtPeriodEnd: updated.cancel_at_period_end,
                currentPeriodEnd: updated.current_period_end,
                status: updated.status,
            },
        });
    } catch (e) {
        return handleErrors(e);
    }
};
