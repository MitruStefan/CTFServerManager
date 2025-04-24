# CTF Server Manger

Discord Bot with useful features to manage the team's Discord server for team [> r0/dev/null](https://ctftime.org/team/305658).

## Prefix commands

-   !remind_me [time] [message] - Set a reminder for yourself. Time in minutes.
-   !setup [ctf_name] - Setup a new CTF in the server. This will create channels and a new role for the CTF.
-   !finish [ctf_name] - Finish a CTF. This will delete the role and prepend the category with `[finished]`

## Slash commands

-   /ping - Checks the bot's latency.
-   /remind_me [time] [message]
-   /setup [ctf_name]
-   /finish [ctf_name]

## Features

-   Automatically add and remove the CTF role to users when they react with 1️⃣ to the embed of the CTF. (Embed is from /event command in [ctf-sentinel](https://github.com/MitruStefan/ctf-sentinel))

## To-do

-   Add toggle for the role add/remove feature? Maybe in env?
