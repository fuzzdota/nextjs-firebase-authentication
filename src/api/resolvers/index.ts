import { GraphQLDateTime } from 'graphql-iso-date';
import { resolvers as migrationResolvers } from './migration';
import { resolvers as sessionResolvers } from './session';
import { resolvers as userResolvers } from './user';
import { resolvers as storefrontResolvers } from './storefront';
import { resolvers as paypalResolvers } from './paypal';
import { resolvers as stripeResolvers } from './stripe';
import { resolvers as courseResolvers } from './course';
import { resolvers as bookResolvers } from './book';
import { resolvers as upgradeResolvers } from './upgrade';
import { resolvers as couponResolvers } from './coupon';
import { resolvers as partnerResolvers } from './partner';
import { resolvers as communityResolvers } from './community';

const customScalarResolver = {
  DateTime: GraphQLDateTime,
};

export default [
  customScalarResolver,
  migrationResolvers,
  sessionResolvers,
  userResolvers,
  storefrontResolvers,
  paypalResolvers,
  stripeResolvers,
  courseResolvers,
  bookResolvers,
  upgradeResolvers,
  couponResolvers,
  partnerResolvers,
  communityResolvers,
];
