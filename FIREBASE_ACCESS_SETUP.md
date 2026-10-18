# Restaurant access setup

The existing Firebase project is preserved. These rules must be deployed to that project; hiding forms alone does not secure Firestore.

1. In Firebase Authentication, create or select `pragathimedi10@gmail.com`. This is the configured super-admin address and must stay consistent in `src/lib/restaurant-access.ts` and `firestore.rules`; email verification is not required.
2. In Firestore → Rules, replace the rules with `firestore.rules` and publish them. Alternatively use the Firebase CLI with `firebase deploy --only firestore:rules --project restaurant-web-3976b` after configuring `firebase.json` to point to this rules file.
3. For every restaurant, create the private document `restaurant_access/{restaurantId}` containing `owner_uids: ["FIREBASE_AUTH_USER_UID"]`. Copy UIDs from Firebase Authentication → Users. Use the Firebase console as project administrator; do not put owner assignments in public menu documents. Unassigned users are denied access.
4. Keep each public menu in `restaurant_data/{restaurantId}` with `settings`, `categories`, and `menu_items`. Category image URLs use the optional `image_url` field. Existing categories without this field retain their default category image.

`/` and `/admin` use `main`. `/{restaurantId}` and `/{restaurantId}/admin` use the matching restaurant. Owners can only update `menu_items` for their assigned restaurants. Verified super admins can update settings, categories, and items for any restaurant and create a restaurant by saving a missing restaurant's settings.

The public menu performs one Firestore document read per load. The admin also reads its separate access document for owners. Writes use direct patches without reading the menu again. Denied or failed reads never substitute another restaurant's menu; demo data is only shown for a missing `main` document on the public page.