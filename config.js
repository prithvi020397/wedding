/*  Settings used by the page's scripts. All wording lives in index.html. */
window.INVITE = {
  // Wedding muhurtham — drives the countdown
  date: "2026-12-19T07:49:00-06:00",

  // Background music (starts when the envelope is tapped).
  // "Kalyani trap" (38 s, loops)
  // drop: second at which the beat kicks in, the moment the invite page appears
  music: { src: "assets/music.mp3?v=3", volume: 0.7, drop: 12.42 },

  // RSVPs are saved by api/rsvp.js into a Google Sheet (see README.md, "RSVP setup")

  // Venue for "View location" and calendar entries
  venueQuery: "Serengeti Estates, Gate B, 3487 Co Rd 338, Melissa, TX 75454",
  // Google Maps link for "View location". Leave "" to search the address above.
  mapUrl: "",

  // "Through your eyes": guests' photos and videos. The upload button appears from `opens`
  // once `uploadUrl` is set (where the uploads go is still to be decided).
  memories: { opens: "2026-12-16T00:00:00-06:00", uploadUrl: "" },

  // Calendar entries (UTC times)
  events: {
    wedding: {
      title: "Prithvi & Jyosthna — Wedding Muhurtham",
      start: "20261219T134900Z", end: "20261219T183000Z"
    }
  }
};
