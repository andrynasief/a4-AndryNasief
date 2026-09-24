# 3D Sphere Merge - Andry Nasief**

**Live App** [LINK](https://a4-andry-nasief.onrender.com/)

You can aim and drop colored spheres into a glass cylinder. Matching spheres merge into larger spheres, earn points, and produce synthesized sound effects. The goal is to build larger spheres and increase the score without keeping the stack above the orange danger line.

## How to play

1. Read the instructions shown when the page loads, then select **Start dropping**.
2. Move the mouse to aim. The preview sphere shows the drop position, and the colored disc on the floor marks its horizontal location. Collisions can change where the sphere eventually rests.
3. Click to drop a sphere. Matching spheres merge on contact until they reach the largest tier.
4. Watch your **Score** and the **Next** color indicator. Keep slow-moving spheres below the orange danger line; sustained overflow ends the game.
5. Open **Controls** to adjust the five parameters below while playing.
6. Select **?** to pause and reopen the instructions, or **Try again** after a game ends.

Desktop mouse controls are recommended. Pointer Events also handle touch input, but touching the canvas immediately drops a sphere at the current preview position; dragging updates the aim for a subsequent drop.

| Control | Effect |
| --- | --- |
| Gravity | Changes downward acceleration; more negative values pull spheres down faster. |
| Bounciness | Changes how strongly spheres bounce after collisions. |
| Drag | Sets the fraction of velocity retained each physics step. Lower values slow spheres more; 1 removes this damping. |
| Spin speed | Changes the camera's automatic rotation speed; 0 stops rotation. |
| Glass opacity | Changes how transparent the cylinder appears. |

## Technical achievements

- **3D graphics with Three.js:** A perspective camera, multiple lights, glossy sphere materials, and a transparent cylinder create the scene. The camera orbits the container, and the renderer resizes with the browser window.
- **Custom JavaScript physics:** Gravity, velocity damping, floor and cylinder-wall collisions, and sphere-to-sphere collisions run without a separate physics library. Sphere collisions use overlap correction and impulse-based bounce, with mass proportional to radius cubed.
- **Fixed-step simulation:** Physics advances in 1/120-second steps, separately from rendering through `requestAnimationFrame`. Frame-time and step limits bound the work performed per frame.
- **Merging and game state:** Nine sphere tiers define size and color. Weighted randomness selects starting spheres, and a set prevents a sphere from joining multiple merge pairs in one physics step. Merges update the score; age, speed, and a 2.5-second overflow timer help distinguish a full container from a newly falling sphere.
- **Raycasting for 3D aiming:** Pointer coordinates are projected onto a horizontal plane at spawn height. The aim is clamped to the container radius while accounting for the next sphere's size. A preview sphere and floor marker provide visual feedback.
- **Web Audio API sound synthesis:** Each merge combines sine and triangle oscillators with short pitch and volume envelopes to create a pop sound. Larger merged spheres produce lower pitches. Audio is initialized through user interaction; no recorded audio files are needed.
- **Live controls with Tweakpane:** Five controls update physics and appearance during play, exceeding the assignment's four-parameter minimum.
- **Express and the browser interface:** Express serves HTML, CSS, and JavaScript from `public`. HTML overlays provide opening instructions, help, and restart controls. The server uses `process.env.PORT` with a local fallback of 3000.

## Implementation challenges

- **Getting the aiming to work in 3D:** I had to connect the mouse's position on a flat screen to a drop position inside the 3D container, even while the camera was rotating. I used raycasting to figure out that position and limited how far it could move so the sphere would fit inside the glass. I also added the preview sphere and floor marker to make it easier to see where a drop would start.
- **Handling collisions and merges together:** I had to make sure a sphere could bounce off other spheres while still merging when it touched a matching one. Removing spheres in the middle of checking collisions would make the remaining pairs harder to keep track of, so I collect the merge pairs first and replace them afterward. I also track which spheres are already merging so the same sphere cannot be used twice in one physics step.
- **Deciding when the container is actually full:** I didn't want a player to lose just because a new sphere briefly passed above the danger line on its way down. I check how long each sphere has been in the game and how fast it is moving before counting it toward an overflow. The stack then has to stay in danger for 2.5 seconds, giving the spheres a chance to settle or merge before the game ends.
- **Making the merge sounds:** I wanted the merges to have a short pop sound, so I used the Web Audio API to generate it instead of loading a recorded sound file. I combined two tones and quickly changed their pitch and volume, with lower pitches for larger spheres. I also had to start the audio through a button click or canvas interaction because browsers can block sound before the user interacts with the page.
