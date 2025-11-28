# pastebin

This is a simple [Pastebin](https://pastebin.com) clone where every paste is backed by [Tigris](https://tigrisdata.com/) and [Keyv](https://keyv.org/) using [@tigrisdata/keyv-tigris](https://www.npmjs.com/package/@tigrisdata/keyv-tigris).

To get started:

1. Create a bucket at [storage.new](https://storage.new).
2. Create an [access key](https://www.tigrisdata.com/docs/iam/manage-access-key/) for that bucket with Editor permissions.
3. Copy `.env.example` to `.env`.
4. Start the service in Docker:

   ```text
   docker run --rm -it --name pastebin --env-file .env -p 3333:3333 ghcr.io/tigrisdata-community/pastebin
   ```

Then open your browser to [localhost:3333](http://localhost:3333) and post away! All your posts will be seamlessly stored across the globe in Tigris.

## How it works

This app is an [Express.js](https://expressjs.com/) app written with [HTMX](https://htmx.org/) to make the website interactive. If you are using an environment where JavaScript is disabled, this app will not function.

Creating a paste inserts a JSON object like this into Tigris:

```json
{
  "value": {
    "id": "019acb05-df16-758f-a4fe-c5026f54e12e",
    "title": "arst",
    "body": "arst",
    "createdAt": "2025-11-28T15:12:31.000Z"
  }
}
```

When you visit a paste URL (eg: `/paste/019acb05-df16-758f-a4fe-c5026f54e12e`), Keyv loads the paste data out of Tigris and renders it in the browser.

The cool part about this flow is that the server returns only the bit of HTML on the page that needs to change:

```html
<h2 class="text-3xl font-bold text-gray-800 mb-4">
  This is a test of HTMX and express.js
</h2>
<pre class="bg-gray-100 rounded p-4 text-gray-800 mb-6 whitespace-pre-wrap">
Honestly this is really cool, I love how the server just deals with HTML instead of having to convert between JSON and HTML!</pre
>
<div class="flex flex-col gap-2 text-sm text-gray-600">
  <div>
    <span class="font-semibold">ID:</span>
    <span class="font-mono">019acb3f-0e5e-7e37-b65e-3cb2c10d8faa</span>
  </div>
  <div>
    <span class="font-semibold">Created At:</span>
    <span class="font-mono">2025-11-28T16:14:58.655Z</span>
  </div>
</div>
```

Please [dig through the source code](./src/main.ts) and try this pattern out for yourself! Tigris' globally distributed and consistent object storage makes for a great backend for simple apps like this. Try enabling lifecycle deletion and see how that changes what you do! The sky's the limit!
