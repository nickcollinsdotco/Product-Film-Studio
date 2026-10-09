# Product Film Studio

A personal system for making premium product films from real product screenshots, recordings and captured sites: mostly short silent Loops, and occasionally a full 15–20 second Film. Films are composed from reusable Shots, not edited by hand on a timeline.

## Structure

**Project sheet**:
The written starting point of a Project: the product, its Product brand, the Look defaults, its Screens and the slate of planned Films. Every Brief inherits from it.
_Avoid_: project brief, brand kit

**Brief**:
The written starting point of a Film: the one point it must land and the Edits wanted. A Loop's Brief is its Loop card in the Project sheet; a full Film's Brief is its own file.
_Avoid_: spec (that is an engineering spec), treatment

**Project**:
Everything needed to make films for one product: its Product brand, its assets and its Films. Each Project has its own version history, separate from the Library's.
_Avoid_: film (for the container), job, workspace

**Film**:
One product story inside a Project, made as one or more Edits.
_Avoid_: video, composition, reel

**Loop**:
A kind of Film: short, silent and untitled, filming one Screen, made to play on repeat. A Film that isn't a Loop is called a full Film.
_Avoid_: clip (in HyperFrames that is a timed element), short, GIF

**Loop shape**:
How a Loop's Shots are arranged so that it comes round again: Bookend or Tour.
_Avoid_: pattern

**Bookend**:
A Loop shape whose last Shot ends exactly on its first Shot's opening framing and speed, so the Seam joins two identical framings.
_Avoid_: boomerang, ping-pong

**Tour**:
A Loop shape that moves from area to area and never returns to its opening framing, so the Seam visibly jumps back to the start.

**Seam**:
The Transition from a Loop's last Shot back to its first: a cut by default, a dissolve allowed.
_Avoid_: loop point, wrap

**Edit**:
One aspect-ratio version of a Film, such as the 4:3, 16:9 or 9:16 Edit. Each Edit has its own sequence of Shots, Transitions and Landing placements, so Edits of the same Film can differ in pacing, order and which Shots they include.
_Avoid_: cut, format, version, variant

**Shot template**:
Reusable choreography with a single intent (for example, "push in on a dashboard"), built from Primitives, with opinionated defaults and only a few parameters. It lays itself out for each aspect ratio. Shared templates live in the Library, such as Hold, Reveal, Drift, Scroll and Orbit; one-off templates live in a single Project.
_Avoid_: scene, preset, block, pattern

**Shot**:
One use of a Shot template in an Edit, with its parameters filled in and its own timing. The same Shot template used twice in an Edit produces two Shots.
_Avoid_: scene, clip, slide

**Freeze**:
What an extended Shot shows once its own timeline has run out: its last frame, held still. A Bookend's last Shot never freezes.
_Avoid_: hold (that is a Shot template)

**Landing**:
A moment inside a Shot where something should hit, such as a Transition, a type entrance or the Camera arriving on a Focus area. The Edit places each Landing on a chosen beat or time, while camera moves can run across beats.
_Avoid_: hit point, sync point, cue

**Transition**:
How one Shot hands over to the next within an Edit: cut, blur dissolve or match move.
_Avoid_: wipe (unless it literally is one)

**Shot list**:
The planned sequence of Shots for an Edit, each with its intent and Landings, written before anything is built.
_Avoid_: storyboard, outline

**Contact sheet**:
Stills rendered from the real Shots at each Landing, used to approve framing and composition before reviewing motion.
_Avoid_: storyboard (in HyperFrames that is a sketch made before building)

**Draft render**:
A fast render for reviewing timing and motion. It may substitute fallbacks, such as a missing Product brand font.
_Avoid_: preview (that is HyperFrames Studio playback), proxy

**Final render**:
The deliverable render of an Edit at full quality. It refuses substitutions unless the Film's Brief explicitly accepts them.
_Avoid_: export, master

**Library**:
The shared collection of Primitives, Renderers and Shot templates that every Project draws from.
_Avoid_: studio (that is HyperFrames Studio, the preview app), framework, engine

## Choreography

**Primitive**:
A named, renderer-independent motion intent that Shot templates are built from, such as camera push-in, surface tilt or surface focus. Primitives are always written in full as code (`camera.drift`); a capitalised bare word (Drift) names a Shot template.
_Avoid_: effect, animation, preset

**Renderer**:
The thing that turns Primitives into pixels. CSS 3D is the first Renderer; Three.js is planned.
_Avoid_: backend, engine

**Camera**:
The virtual viewpoint a Shot moves through, including its focus.
_Avoid_: viewport, view

**Focus path**:
The ordered Focus areas a Loop visits, written with `→` for a move within a Shot and `/` for a cut to the next Shot. It does a Loop's Shot list's job.
_Avoid_: angles, camera path

## Content

**Screen**:
A still image of product UI, usually a high-resolution screenshot. Screens are the primary hero material.
_Avoid_: screenshot (in prose), image, mockup

**Focus area**:
A named region of a Screen that the Camera can frame and focus on. It belongs to the Screen, so every Film using that Screen shares it; every Screen has the built-in area `whole`.
_Avoid_: angle, hotspot, region

**Recording**:
A screen recording of a product, used only when the interaction itself needs to be shown. It is recorded with the system cursor hidden.
_Avoid_: video, capture

**Capture**:
A frozen local snapshot of a running product taken from a live URL. Once taken, it is treated like Screens and Recordings.
_Avoid_: live embed, scrape

**Surface**:
A flat plane in the Shot's space that displays a Screen, Recording or Capture.
_Avoid_: card, panel, layer, screen (for the plane)

**Device frame**:
An optional property of a Surface that turns it into a device: none, browser, phone or laptop. A "device" is just a Surface with a Device frame.
_Avoid_: mockup, bezel, device

**Cursor**:
The synthetic pointer the Film draws. It is never the cursor baked into a Recording.
_Avoid_: mouse, pointer

## Brand

**Default theme**:
The neutral, restrained look every Film starts from: the Backlight Backdrop and Geist type, so the product's Screens carry the weight. Type colour follows the Backdrop, chosen for contrast. A Product brand re-themes it.
_Avoid_: house style, base style, template

**Product brand**:
The product's small fixed set of tokens (colours, typography, corner radius, logo, Backlight strength). It re-themes the Default theme for the whole Film.
_Avoid_: theme (on its own), skin

**Backdrop**:
The space behind a Shot's Surfaces: void (flat near-black), Backlight (near-black with the Backlight glow), studio light (a pale grey gradient) or brand colour (a flat fill in a Product brand colour).
_Avoid_: scene, environment, set

**Backlight**:
The soft glow behind Surfaces on a dark Backdrop, tinted by the Product brand accent. Its strength is a Product brand token that a Project or Loop can override; at zero it is the void Backdrop.
_Avoid_: glow, halo, ambient light

**Sign-off**:
An optional, small, neutral mark and name shown for the final moment of a portfolio Film's end card, identifying it as Nick's work. Nothing else in the Film carries the maker's identity.
_Avoid_: house style, watermark, outro
