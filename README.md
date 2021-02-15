# mp3-server
this app finds your mp3 files on your drive and serves as a web player to the devices on your local network.

first you need to edit playlist.json to tell server where your mp3 files are.
you can add multiple folders and you can name them. On the client side you will see them as a playlists.
basically this is an array of playlists.

an example of playlist.json file:
[
    {
        "name": "My Pop Playlist",
        "path": "D:\\Tracks\\Pop"
    },
    {
        "name": "My Jazz Plalist",
        "path": "D:\\Tracks\\Jazz"
    }
 ]
 
 after you edit playlist.json file all you need to do is running the server by "node server.js" then you can access the player by the link "localhost/mp3player"
 or any remote device on your network "server-ip-address/mp3player". For example a server running with an ip address of 192.168.1.20 then you can access you mp3 file from your ios/android device by "192.168.1.20/mp3player" address. 
 
