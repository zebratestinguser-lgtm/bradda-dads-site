# Showing the latest Facebook posts on the website

The website can show the three newest posts from the Bradda Dads Facebook page on the homepage and the News page ("Latest on Facebook"). Every time the site rebuilds (each morning, and whenever anyone saves a change), it fetches the posts and copies their photos onto the site. Visitors never load anything from Facebook, so there's no tracking.

To let the site read the page, a **Page admin** needs to create an "access token" once. It takes about 20 minutes. Meta changes its screens from time to time, so the button names may differ slightly.

**Never paste the token into a chat, an email or a file in the repository.** It only goes into GitHub's secret settings (step 6).

## 1. Create a Meta developer app

1. Go to **developers.facebook.com** and log in with your own Facebook account (the one that's an admin of the Bradda Dads page). If asked, register as a developer and accept the terms.
2. Click **My Apps → Create app**.
3. When asked what the app should do, choose **Other**, then the app type **Business**. (If it offers a use case like "Manage everything on your Page", that's fine too.)
4. Name it **Bradda Dads website**, and leave the business portfolio empty if that's allowed.

The app can stay in **Development** mode: that's enough for reading your own page.

## 2. Get a token for your account

1. Open **Tools → Graph API Explorer**.
2. At the top right, pick the **Bradda Dads website** app.
3. Under **Permissions**, add **pages_show_list** and **pages_read_engagement**.
4. Click **Generate Access Token**, log in if asked, and allow access to the **Bradda Dads** page.

## 3. Make it long-lasting

1. Open **Tools → Access Token Debugger**.
2. Paste the token from step 2 and click **Debug**.
3. At the bottom, click **Extend Access Token** and copy the new token.

## 4. Get the Page's own token

1. Go back to the **Graph API Explorer** and paste the long-lasting token into the **Access Token** box.
2. In the query box, type `me/accounts` and click **Submit**.
3. In the result, find **Bradda Dads**. Note its **id** (the Page ID) and copy its **access_token** (the Page token).

## 5. Check it never expires

Paste the Page token into the **Access Token Debugger**. It should say **Expires: Never**. If it shows a date, repeat steps 3 and 4.

## 6. Give it to the website (GitHub)

1. Open the repository on GitHub: **github.com/zebratestinguser-lgtm/bradda-dads-site**.
2. Go to **Settings → Secrets and variables → Actions → New repository secret**.
3. Add two secrets:
   - Name **FB_PAGE_ID**, value: the Page ID from step 4.
   - Name **FB_PAGE_TOKEN**, value: the Page token from step 4.

## 7. Rebuild the site

Go to **Actions → Deploy to GitHub Pages → Run workflow**, or just wait for the next morning's rebuild. After a few minutes the posts appear on the homepage and the News page.

## If it stops working

The token stops working if the admin who made it changes their Facebook password, stops being a Page admin, or deletes the app. The site keeps building, the Facebook row just disappears, and the build log shows a warning starting "Facebook posts". To fix it, repeat steps 2 to 6 and replace the FB_PAGE_TOKEN secret.
