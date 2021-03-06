// TODO https://github.com/paypal/Checkout-NodeJS-SDK/issues/25
import paypal from '@paypal/checkout-server-sdk';

import { MutationResolvers } from '@generated/server';
import { priceWithDiscount } from '@services/discount';
import paypalClient from '@services/paypal';
import { createCourse } from '@services/firebase/course';

import storefront from '@data/course-storefront';

interface Resolvers {
  Mutation: MutationResolvers;
}

export const resolvers: Resolvers = {
  Mutation: {
    // https://developer.paypal.com/docs/checkout/reference/server-integration/set-up-transaction/
    paypalCreateOrder: async (
      _,
      { courseId, bundleId, coupon, partnerId },
      { me, couponConnector, courseConnector }
    ) => {
      const course = storefront[courseId];
      const bundle = course.bundles[bundleId];

      if (!me) {
        return { orderId: null };
      }

      const price = await priceWithDiscount(
        couponConnector,
        courseConnector
      )(courseId, bundleId, bundle.price, coupon, me?.uid);

      const request = new paypal.orders.OrdersCreateRequest();

      request.prefer('return=representation');

      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: courseId,
            custom_id: JSON.stringify({
              courseId,
              bundleId,
              coupon,
              partnerId,
            }),
            description: `${courseId} ${bundleId}`,
            amount: {
              currency_code: 'USD',
              value: (price / 100).toFixed(2),
            },
          },
        ],
      });

      let order;
      try {
        order = await paypalClient().execute(request);
      } catch (error) {
        throw new Error(error);
      }

      return { orderId: order.result.id };
    },
    // https://developer.paypal.com/docs/checkout/reference/server-integration/capture-transaction/
    paypalApproveOrder: async (
      _,
      { orderId },
      { me, courseConnector, partnerConnector, couponConnector }
    ) => {
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});

      try {
        const capture = await paypalClient().execute(request);

        const {
          amount,
          custom_id,
        } = capture.result.purchase_units[0].payments.captures[0];

        const { courseId, bundleId, coupon, partnerId } = JSON.parse(
          custom_id
        );

        const course = await courseConnector.createCourse({
          userId: me!.uid,
          courseId: courseId,
          bundleId: bundleId,
          price: +amount.value.replace('.', ''),
          currency: 'USD',
          paymentType: 'PAYPAL',
          coupon: coupon,
        });

        if (coupon) {
          await couponConnector.removeCoupon(coupon);
        }

        if (partnerId && partnerId !== me?.uid) {
          await partnerConnector.createSale(course, partnerId);
        }

        // LEGACY
        await createCourse({
          uid: me?.uid,
          courseId,
          bundleId,
          amount: amount.value,
          paymentType: 'PAYPAL',
          coupon,
        });
        // LEGACY END
      } catch (error) {
        throw new Error(error);
      }

      return true;
    },
  },
};
