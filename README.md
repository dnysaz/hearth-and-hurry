# hearth-and-hurry

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/dnysaz/hearth-and-hurry/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/dnysaz/hearth-and-hurry/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Hearth & Hurry is an original night-shift cooking game: walk a counter, pick ingredients, chop, cook, plate and serve tickets against live timers. Three paper tickets ask for one of five recipes at a time. Each dish needs an exact set of ingredients, a chop on the board, a careful stay at the stove, a plate at the pass and a serve to the focused ticket. Plates served early earn more; burnt pans and wrong plates cost a heart. Six waves get faster, combos build, and a local best score survives a reload.

The whole game is plain static files under `game/`. It uses a 1280×720 canvas that fits any desktop window, draws every tile, ticket, ingredient, chef and spark from code, and synthesises its tiny cues with WebAudio. It loads no library, image, font, sound file or network resource. Keyboard: `A`/`D` or arrows walk, `1`–`6` pick ingredients, `E` acts at the nearest station, `C` chops, `V` cooks, `B` plates, `Enter` serves, `X` scrapes a burnt pan, `Tab` focuses the next ticket, `P` pauses, `M` mutes and `R` restarts. Mouse: click a ticket to focus it, click a station to walk there and act, or click the pass with a plate ready to ring the bell. `?shot=cover`, `?shot=order`, `?shot=cook` and `?shot=serve` stage deterministic real-game scenes for the screenshots.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

To build the judged output locally:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=83j7g1qd&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
