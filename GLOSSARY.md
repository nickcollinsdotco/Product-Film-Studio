# Product Film Studio

A personal system for making premium 15–20 second product films from real product screenshots, recordings and captured sites. Films are composed from reusable shots, not edited by hand on a timeline.

## Structure

**Brief**:
The written starting point of a Film: the product, the one to three messages it must land, and the Edits wanted.
_Avoid_: spec (that is an engineering spec), treatment

**Project**:
Everything needed to make films for one product: its Product brand, its assets and its Films. Each Project has its own version history, separate from the Library's.
_Avoid_: film (for the container), job, workspace

**Film**:
One product story inside a Project, made as one or more Edits.
_Avoid_: video, composition, reel

**Edit**:
One aspect-ratio version of a Film, such as the 16:9 Edit or the 9:16 Edit. Each Edit has its own sequence of Shots, Transitions and Landing placements, so Edits of the same Film can differ in pacing, order and which Shots they include.
_Avoid_: cut, format, version, variant

**Shot template**:
Reusable choreography with a single intent (for example, "push in on a dashboard"), built from Primitives, with opinionated defaults and only a few parameters. It lays itself out for each aspect ratio. Shared templates live in the Library; one-off templates live in a single Project.
_Avoid_: scene, preset, block

**Shot**:
One use of a Shot template in an Edit, with its parameters filled in and its own timing. The same Shot template used twice in an Edit produces two Shots.
_Avoid_: scene, clip, slide

**Landing**:
A moment inside a Shot where something should hit, such as a Transition or a type reveal. The Edit places each Landing on a chosen beat or time, while camera moves can run across beats.
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
A named, renderer-independent motion intent that Shot templates are built from, such as camera push-in, surface tilt or surface focus.
_Avoid_: effect, animation, preset

**Renderer**:
The thing that turns Primitives into pixels. CSS 3D is the first Renderer; Three.js is planned.
_Avoid_: backend, engine

**Camera**:
The virtual viewpoint a Shot moves through, including its focus.
_Avoid_: viewport, view

## Content

**Screen**:
A still image of product UI, usually a high-resolution screenshot. Screens are the primary hero material.
_Avoid_: screenshot (in prose), image, mockup

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
An optional property of a Surface that draws framing around it: none, browser, phone or laptop. A "device" is just a Surface with a Device frame.
_Avoid_: mockup, bezel, device

**Cursor**:
The synthetic pointer the Film draws. It is never the cursor baked into a Recording.
_Avoid_: mouse, pointer

## Brand

**Default theme**:
The neutral, restrained dark look every Film starts from: near-black with a subtle Backlight, so the product's Screens carry the weight. A Product brand re-themes it.
_Avoid_: house style, base style, template

**Product brand**:
The product's small fixed set of tokens (colours, typography, corner radius, logo, Backlight strength). It re-themes the Default theme for the whole Film.
_Avoid_: theme (on its own), skin

**Backlight**:
The soft glow behind Surfaces, tinted by the Product brand accent. Its strength is a Product brand token, and at zero the background is flat near-black.
_Avoid_: glow, halo, ambient light

**Sign-off**:
An optional, small, neutral mark and name shown for the final moment of a portfolio Film's end card, identifying it as Nick's work. Nothing else in the Film carries the maker's identity.
_Avoid_: house style, watermark, outro
