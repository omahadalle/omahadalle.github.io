# Somalia coastal locations: interactive map

An interactive map of 1,467 places along Somalia's coast, from the
*Gazetteer of Somalia* (2nd edition, June 1987, U.S. Defense Mapping Agency /
U.S. Board on Geographic Names). It includes towns, wells, wadis, capes, points,
bays, islands, reefs and shoals along the Gulf of Aden and Indian Ocean coasts.

It's a plain static website with no server code, database or build step.

## Put it on your GitHub Pages site

### 1. Upload the folder

1. Open your GitHub Pages repository (usually `yourname/yourname.github.io`).
2. Click **Add file → Upload files** and drag in the whole `somalia-coast-map` folder.
   Keep its sub-folders as they are.
3. Click **Commit changes** and wait a minute for GitHub Pages to rebuild.
4. Check it opens on its own at `https://yourname.github.io/somalia-coast-map/`.

### 2. Put it inside an existing page

Open the page you want it on (an `.html` or `.md` file in the repository), click the pencil to edit,
and paste the contents of **`embed-snippet.html`** where the map should appear:

```html
<iframe
  src="/somalia-coast-map/"
  data-open-height="650"
  title="Somalia coastal locations"
  loading="lazy"
  style="width:100%; height:72px; border:0; display:block; transition:height .3s ease"></iframe>
<script>
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.type !== "somalia-coast-map") return;
    var frames = document.querySelectorAll("iframe[data-open-height]");
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow !== e.source) continue;
      var open = parseInt(frames[i].getAttribute("data-open-height"), 10) || 650;
      frames[i].style.height = (d.shown ? Math.max(open, d.height) : d.height) + "px";
    }
  });
</script>
```

The page then shows only the map's title bar. Clicking the eye opens the map, and the frame grows to
`data-open-height` (650 px; change it if you like). The frame also grows for search results and the About box.

- **Markdown pages (`.md`)** work too: paste the snippet as-is on its own lines, with a blank line before and after.
- **Project sites:** if your site lives at `https://yourname.github.io/my-repo/` (a project repository,
  not `yourname.github.io`), use `src="/my-repo/somalia-coast-map/"`.

## Other hosts

The folder works on any static host too: Netlify (drag the folder onto app.netlify.com/drop), Vercel,
cPanel/FTP hosting, or WordPress (upload the folder to your site's root). Use the same embed snippet.

You can also double-click `index.html` to open it from your computer. It works offline.
Only the optional Satellite and Street map backgrounds need an internet connection.

## What's in the folder

```
somalia-coast-map/
├── index.html            the page
├── embed-snippet.html    code to paste into another page of your site
├── css/style.css         page and map styling
├── js/map.js             map behaviour: layers, legend, search, popups
├── data/
│   ├── locations.js      the 1,467 places (generated)
│   ├── land.js           Somalia's 18 regions + detailed neighbouring countries (generated)
│   ├── world.js          every other country in the world (generated)
│   └── somalia_coastal.csv   source table (same as the spreadsheet)
├── lib/leaflet/          Leaflet 1.9.4 map library, included so no CDN is needed
└── tools/
    ├── build_data.py            regenerates data/*.js from the CSV
    ├── somalia_regions.geojson  Somalia's 18 regions (amCharts)
    ├── neighbours.geojson       neighbouring countries, detailed (Natural Earth 1:10m)
    └── world.geojson            rest of the world (Natural Earth 1:50m)
```

## Updating the places

If you edit the spreadsheet, download it as CSV, then run:

```bash
pip install pandas
python tools/build_data.py path/to/your-export.csv
```

Then upload the new `data/locations.js`. The CSV needs these columns: `Name`, `Feature type`,
`Coast`, `Region`, `Latitude`, `Longitude`, `Lat (decimal)`, `Lon (decimal)`. The columns
`Also known as (variant names)`, `Gazetteer page` and `Unverified †` are optional.

To change the title or the About text, edit `index.html`. To change colours, edit the
`GROUPS` list at the top of `js/map.js`.

## Notes on the data

- The map shows the whole world; it opens zoomed on Somalia. Hover any country to see its name.
- Somalia is drawn as one country divided into its 18 regions. Hover a region to see its name;
  names also appear on the map when you zoom in.

- Coordinates are given to the nearest minute (about 1.8 km), as printed in the gazetteer.
- "Coastal" means sea features within about 40 km of the shore, or any other entry
  within about 5 km of the shoreline.
- Names were read from a scanned copy of the book, so a few spellings may have recognition
  errors. Each popup shows the gazetteer page so you can check the original.
- Names marked † were flagged in the gazetteer as unverifiable on the 1976 maps.

## Credits

- Data: *Gazetteer of Somalia*, 2nd ed. (1987), U.S. Defense Mapping Agency (a U.S. Government work).
- Somalia region boundaries: amCharts geodata (free "linkware" licence). **Keep the
  "Regions: amCharts" link in the map's bottom-right credits.** That link is the licence condition.
  These are present-day regions; Awdal and Sool were formed after the 1987 gazetteer, so a few
  places' gazetteer region differs from the region they fall in on the map.
- Neighbouring countries and the rest of the world: Natural Earth (public domain), via the `world-atlas` package.
- Map library: Leaflet (BSD-2-Clause, see `lib/leaflet/LICENSE`).
- Optional backgrounds: Esri World Imagery; © OpenStreetMap contributors.
