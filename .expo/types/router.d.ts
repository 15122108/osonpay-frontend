/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)/create-pin` | `/(auth)/login` | `/(auth)/pin-lock` | `/(tabs)` | `/(tabs)/` | `/(tabs)/cards` | `/(tabs)/history` | `/(tabs)/profile` | `/_sitemap` | `/cards` | `/create-pin` | `/history` | `/login` | `/modals/addcard` | `/modals/kyc` | `/modals/receive` | `/modals/send` | `/modals/topup` | `/modals/transaction` | `/pin-lock` | `/profile`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
