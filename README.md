# roze.run

This project contains a Discord bot that provides updates about whose turn it is in a Civ 6 game.

For adding roze to your server, check out https://roze.run and you'll be good to go. If you want to build your own instance, read on!

## Project Structure

roze.run is primarily a Node.js app in server/ that has two main responsibilities:

1. It receives update from a Civ 6 game when users have taken their turn.
2. It controls a Discord Bot that can relay those messages to users.

There is also some minimal static content in www/ that is served at https://roze.run, a PostgresSQL DB that keeps track of some minimal information to know which discord servers to send which messages to, and optinally some nginx config (or your server of choice) to route requests to the Node.js app.

## Prerequisites

### env variables

You'll need a few things before you can get started to populate your `.env` variables when setting up the application.

First, you'll want to create an app and configure a bot. Check out https://discord.com/developers/docs/getting-started for background. From this, you'll have an `APP_ID`, `DISCORD_TOKEN`, and `PUBLIC_KEY`. Save these for later.

Next, set up a PostgresSQL instance. Check out their docs at https://www.postgresql.org/docs/current/index.html or https://www.linode.com/docs/guides/how-to-install-use-postgresql-ubuntu-20-04/ for details. You'll probably run something like:

```
$ createdb <db>
$ createuser <user> --pwprompt
```

After settting this up, you should have your `POSTGRES_HOST`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_PORT`.

Finally, choose the port that you want to run your Node.js app on. This will be your `PORT`.

### nginx config

If you're routing requests to your application via nginx, you'll need to add something like the following:

```
server {
    server_name roze.run;

    location / {
      root /path/to/www/;
    }

    location /discord {
      proxy_pass http://localhost:<server_port>/discord;
    }

    location /new {
      return 301 https://discord.com/api/oauth2/authorize?client_id=<your_client_id>&permissions=2048&scope=bot%20applications.commands;
    }

    listen 443 ssl;
    ... [standard ssl stuff] ...
}

server {
    server_name roze.run;
    listen 80;

    location / {
        return 301 https://$host$request_uri;
    }

    location /_/ {
      proxy_pass http://localhost:<server_port>/_/;
    }
}
```

### PostgresSQL init

Run the following to initialize your database:

```
CREATE TABLE Channels (
channel_id varchar(20) PRIMARY KEY,
roze_id char(4) UNIQUE,
create_time timestamp DEFAULT now()
);

CREATE TABLE Users (
channel_id varchar(20) REFERENCES Channels,
steam_name varchar(30),
discord_id varchar(20),
create_time timestamp DEFAULT now()
);

CREATE UNIQUE INDEX channel_player_idx ON Users (channel_id, steam_name);

GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public to <your db user>;
```

If you ever want to reset it, you can just run:

```
DROP TABLE Users,Channels;
```

And then reinit your db running the command above.

## Setting up the application

You can start by cloning this repo on your server:

```
git clone https://github.com/zkhr/roze.git
```

Then navigating to the directory and install dependencies:

```
cd roze
npm install
```

Next, copy the `.env.sample` over to `.env` and fill in the variables you got from the prereqs above.

You should now be able to start the applicatoing:

```
npm start
```

Once it is running, you can add the interactions endpoint URL in the Discord Developer Console for your application and save. This should be the route you set up in your nginx config (or other server) with the `/discord` path. For example, `https://roze.run/discord`.

You can now add the bot to your server and try it out. See https://roze.run for usage details. You'll need to change paths accordingly for the domain that you are using.
