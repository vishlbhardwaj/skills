# Skills

Skills for coding agents (Claude Code, Codex, Cursor and others that read `SKILL.md`).

## doodle

Draws anything as a code-generated line illustration: objects, products, people,
plants, buildings, landscapes, scenes and storyboards. Every drawing is authored as
geometry and rendered by a seeded "hand", so the result looks drawn. It is judged as a
finished line drawing first, with colour as a second pass. The engine is plain HTML and
JS, bundled inside the skill, with nothing to install.

```sh
npx skills add vishlbhardwaj/skills --skill doodle
```

Then ask your agent to "doodle a bicycle" or "draw a rainy street in pen and ink".
On first use it copies the engine into `./doodle` in your project and draws there.

### Better results: give it a reference

Attach a photo or image of what you want and say what to take from it:
"doodle this chair", "draw my desk from this photo", "a street like this one, at night".
The agent measures the reference (proportions, the shapes that make the thing
recognisable, its palette) and builds the drawing from those numbers instead of from
memory. That is the difference between "a chair" and *this* chair.

A good reference shows the subject clearly from the angle you want, with nothing
covering it. A product photo, your own snapshot or a rough sketch all work. Without one,
the agent writes the proportions down first and works from those.

[Read the skill](skills/doodle/SKILL.md)

## Claude Code plugin

Or install it as a Claude Code plugin:

```
/plugin marketplace add vishlbhardwaj/skills
/plugin install doodle@vishlbhardwaj
```

## Requirements

Chrome or Chromium (for rendering and checks; set `CHROME=/path` if it is somewhere
unusual) and python3. Each skill includes its own licence and any third-party notices.
