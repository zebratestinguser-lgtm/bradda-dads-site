# Handover guide: keeping the website going

For whoever looks after the Bradda Dads website next, especially if nobody in the group knows about code. Keep it with the committee's papers.

**The short version:** day-to-day changes need no code (see [how-to-update.md](how-to-update.md)). The website costs nothing to run, keeps showing its last good version even if nobody touches it for years, and a mistake in the editor can't take it down. The real risk is **losing access to the accounts**, so the most important job is the list below.

## 1. The accounts (who holds the keys)

| What | What it does | Login held by | If it's lost |
|---|---|---|---|
| **GitHub** (github.com, repository `bradda-dads-site`) | Stores the whole website and publishes it (GitHub Pages). Holds the Facebook key. Sends the weekly health-check emails. | **Currently Peter's personal account.** Move it to a group-owned account (section 5). | Nobody can invite editors, fix the Facebook link or change hosting. The site stays up but frozen. |
| **Pages CMS** (app.pagescms.org) | The editor. | Each editor has their own login, by email invite. People with GitHub access to the repository can invite others. | Only the person whose login it was. Someone with GitHub access can invite a new editor. |
| **Group Gmail** (secretarybraddadads@gmail.com) | Contact email; also the Formspree login. | Secretary | Contact form and email stop reaching anyone. |
| **Formspree** (formspree.io) | Sends contact-form messages to the group Gmail. Free plan: 50 messages a month. | Group Gmail | The form stops working. Set "Contact form address (Formspree)" in Site settings to "#" and the Contact page shows the email address instead. |
| **Facebook page** | Posts are copied to the site as draft news stories. | Page admins | See section 3. |
| **SumUp** | Donations, duck race entries, Christmas card payments. | Treasurer | The payment buttons point at dead links (the weekly health check spots this). |
| **Web address** (once there is one) | e.g. braddadads.org.uk | Should be registered in the **group's** name and email, set to auto-renew | The site disappears from that address when it lapses. |
| **Companies House** | Accounts and directors. | Accountant (Thorntons) and directors | Not part of the website, but the footer shows the company details. |

Write down who holds each login and keep it with the committee papers (not passwords: the names of who to ask).

## 2. What editors can change without code

Everything in [how-to-update.md](how-to-update.md):
- news, albums and events (including new events)
- categories and the page wording
- supporters, Where the money goes, Meet the dads, the timeline and duck race winners
- Wolf's Pit results
- the privacy notice and Site settings (contact details, donation links, meeting pubs, footer company details)

What still needs someone who can code:
- the layout and colours
- adding a new kind of page or a new menu section
- the special parts built for particular events: the Christmas card page and banner, the duck race winners page and game, and the Wolf's Pit results pages
- small interface labels (button names, form labels)

## 3. If something stops working

- **A change doesn't appear after 5 minutes:** something in the entry wasn't accepted, often a missing required box or a results file in the wrong format. The live site stays as it was. On GitHub, open the repository's **Actions** tab: the failed run is marked with a red cross and its log names the file. Fix that entry in the editor and save again.
- **The weekly health check email says something failed** (it goes to the GitHub account owner): it lists the page or payment link that stopped working. Usually a SumUp or entry link has changed: update it in the editor.
- **"New on Facebook" disappears from the site:** the Facebook key has stopped working, usually because the admin who made it changed their Facebook password or stopped being an admin. Follow [facebook-setup.md](facebook-setup.md) to make a new one and paste it into GitHub (Settings → Secrets and variables → Actions → FB_PAGE_TOKEN). Nothing else breaks meanwhile.
- **Contact form stops sending:** check the Formspree account (group Gmail login) hasn't hit its 50-a-month limit.
- **GitHub warns about old versions** of things the site uses: the site keeps working for a long time. Ask a developer when convenient (section 6).

## 4. Adding and removing editors

In Pages CMS, someone with GitHub access to the repository opens the project's settings, finds the collaborators section and invites a person by email (they don't need a GitHub account). Remove people who leave the committee the same way. Ask the current owner to check this works before they step down.

## 5. Moving the site off a personal account (do this soon)

1. Create a free **GitHub organisation** (e.g. "bradda-dads") using the group Gmail as its email.
2. Add at least **two committee members as owners**.
3. In the repository's Settings → **Transfer ownership**, move `bradda-dads-site` to the organisation.
4. Reconnect Pages CMS to the moved repository and re-invite the editors.
5. The site's address changes when it moves (it contains the account name), so **do this when the group's own web address is set up**. A developer, or Claude, then updates `site` and `base` in `astro.config.mjs` to the new address.
6. Check GitHub Pages is switched on in the moved repository (Settings → Pages → "GitHub Actions"), and the Facebook secrets came across (Settings → Secrets).

## 6. Getting help

- The site is built with **Astro**, a widely used website tool. Any web developer can pick it up.
- **`CLAUDE.md`** in the repository is a complete description of how everything works and why. Give it to a developer, or open the repository in an AI coding assistant such as Claude Code, which reads it automatically.
- Hosting on GitHub Pages is free, with no server to maintain or renew.

## 7. Things that renew or expire

- **Web address:** yearly (set auto-renew, on a group card).
- **Facebook key:** doesn't expire on its own (see section 3).
- **Formspree:** free plan, no renewal.
- **GitHub and Pages CMS:** free, no renewal.
