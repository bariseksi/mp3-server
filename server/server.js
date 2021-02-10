const http = require("http");
const path = require("path");
const fs = require("fs");
const { Console } = require("console");

const playlistJSONPath = path.join(__dirname, "playlist.json");
const playerHTMLPath = path.join(__dirname, "..", "client", "player.html");
const faviconPath = path.join(__dirname, "favicon.png");

class Container {
   constructor(name, path, id) {
      this.name = name;
      this.path = path;
      this.id = id;
   }
}

let searchingDone = false;
let playlists = parsePlaylists(findPlaylists(playlistJSONPath));
searchingDone = true;

const server = http.createServer((req, res) => {
   if (req.url == "/playlistsjson" && searchingDone) {
      res.writeHead(200, {
         "Content-Type": "application/json; charset=utf-8",
         "Cache-Control": "no-cache",
      });
      res.write(JSON.stringify(playlists));
      res.end();
   } else if (req.url == "/mp3player") {
      const indexHMTL = fs.readFileSync(playerHTMLPath);
      res.writeHead(200, {
         "Content-Type": "text/html; charset=utf-8",
         "Cache-Control": "no-cache",
      });
      res.write(indexHMTL);
      res.end();
   } else if (req.url == "/favicon.png") {
      const buffer = fs.readFileSync(faviconPath);
      res.writeHead(200, {
         "Content-Type": "image/png",
         "Cache-Control": "max-age=31536000, immutable",
      });
      res.write(buffer);
      res.end();
   } else if (req.url.search("/source") >= 0) {
      let source = decodeURI(req.url);
      source = source.replace(/\/source_/, "");
      let [playlistID, songID] = source.split("_");
      songID = parseInt(songID, 10);
      playlistID = parseInt(playlistID, 10);
      let selectedPlaylist = playlists[playlistID];
      let requestedFile = selectedPlaylist.tracks.find((X) => X.id == songID);
      if (requestedFile != undefined) {
         let stat = fs.statSync(requestedFile.path);

         //lets see if its a range request
         let range = req.headers.range;
         if (range) {
            let [start, end] = range.replace("bytes=", "").split("-");
            start = start ? parseInt(start, 10) : 0;
            end = end ? parseInt(end, 10) : stat.size - 1;
            // Handle unavailable range request
            if (start >= stat.size || end >= stat.size) {
               // Return the 416 Range Not Satisfiable.
               res.writeHead(416, {
                  "Content-Range": `bytes */${stat.size}`,
               });
               return res.end();
            }
            //To let client to use seek forward features of the audio tag we need to use Partial Content that is defined in the header and response number should be 206
            res.writeHead(206, {
               "Content-Type": "audio/mpeg",
               "Content-Range": `bytes ${start}-${end}/${stat.size}`,
               "Accept-Ranges": "bytes",
               "Content-Length": end - start + 1,
            });
            let readStream = fs.createReadStream(requestedFile.path, {
               start: start,
               end: end,
            });

            readStream.pipe(res);
         } else {
            res.writeHead(200, {
               "Content-Type": "audio/mpeg",
               "Content-Length": stat.size,
            });
            let readStream = fs.createReadStream(requestedFile.path);

            readStream.pipe(res);
         }
      }
   } else {
      res.end("Invalid request");
   }
});
server.listen(80);
console.log("server running on port 80");

function findTracks(dirPath) {
   let list = [];
   let songid = 0;
   fs.readdir(dirPath, (err, files) => {
      if (files == undefined) {
         return;
      }
      files.forEach((file) => {
         if (path.extname(file) == ".mp3") {
            list.push(
               new Container(
                  path.basename(file).replace(".mp3", ""),
                  path.format({ dir: dirPath, base: file }),
                  songid
               )
            );
            songid++;
         }
      });
   });
   return list;
}

function findPlaylists(playlistPath) {
   let parsedPlaylist = undefined;
   if (fs.existsSync(playlistPath)) {
      let playlist = fs.readFileSync(playlistPath);
      parsedPlaylist = JSON.parse(playlist);
   } else {
      console.log("Playlist JSON does not exist");
   }
   return parsedPlaylist;
}

function parsePlaylists(playlists) {
   let playlist = [];
   let id = 0;
   playlists.forEach((list) => {
      playlist[id] = { name: list.name, tracks: findTracks(list.path), id: id };
      id++;
   });
   return playlist;
}
