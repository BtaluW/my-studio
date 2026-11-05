import { defineQuery } from "next-sanity";

/**
 * Everything the page needs in one round trip.
 * The client uses perspective "published"; the drafts filters are a second
 * line of defence so drafts can never reach the public page.
 */
export const CATALOG_QUERY = defineQuery(`{
  "settings": *[_type == "siteSettings" && _id == "siteSettings"][0]{
    artistName, tagline, about, contactEmail, links[]{label, url}, mailingAddress
  },
  "beats": *[_type == "beat" && defined(slug.current) && defined(audio.url) && !(_id in path("drafts.**"))]
    | order(releasedAt desc, _createdAt desc){
      "id": slug.current, title, genre, bpm, key, hue,
      "src": audio.url, "duration": audio.duration,
      "cover": cover.asset->url
    },
  "playlists": *[_type == "playlist" && defined(slug.current) && !(_id in path("drafts.**"))] | order(name asc){
    "id": slug.current, name, "trackIds": beats[]->slug.current
  }
}`);
