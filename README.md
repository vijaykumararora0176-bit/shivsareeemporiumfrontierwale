# Shiv Saree Emporium — Netlify + Decap CMS

This version replaces the old browser-only localStorage editor with a real Git-backed CMS.

## What you get
- `/admin/` login and content management
- Add/edit/delete blogs without Claude credits
- Add/edit/delete suit collection entries and upload images
- SEO alt-text field for every uploaded suit image
- Static HTML blog pages generated at build time for better SEO
- Today's Blog and All Blogs pages updated automatically
- Collection page updated automatically
- Existing store photo retained unchanged
- Existing three suit photos retained, including the maroon ready-made suit

## Important
This CMS requires the Netlify site to be connected to a GitHub or GitLab repository. A drag-and-drop-only Netlify deployment cannot provide a persistent Git-backed CMS.

After the repository is connected to Netlify:
1. Enable Netlify Identity.
2. Set registration to Invite only.
3. Enable Git Gateway.
4. Invite your admin email.
5. Open `/admin/` and log in.
6. Add a blog or suit and click Publish.
7. Decap CMS commits the content to the repository; Netlify detects the commit and rebuilds the site.

## Local build
Run:
`node build.js`

The deployable site is generated in `dist/`.
