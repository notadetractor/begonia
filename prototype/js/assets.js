// ============================================================
// ASSET MANIFEST — maps names the code uses to files from the artist.
//
// The code never hard-codes a file path; it looks things up here.
// Files keep the artist's names, so updating art is usually just:
// copy the new file from art-source/ over the old one in assets/.
// ============================================================

window.ASSET_MANIFEST = {
  // SnarkGuyBill is built from stacked layers (chair, body, head).
  // Every layer image is 64x64 and lines up when stacked, so no offsets are needed.
  bill: {
    frameSize: 64, // width and height of each sprite image, in pixels

    // Layers are drawn back to front in this order.
    layerOrder: ["chair", "body", "head"],

    // One entry per pose. Turned poses face right; the game mirrors them
    // to make Bill face left. A missing layer is skipped.
    // (The artist's "side" chair and body are drawn at the 3/4 angle.)
    poses: {
      front: {
        chair: "assets/sprites/chair_front.png",
        body:  "assets/sprites/dsp_body_front.png",
        head:  "assets/sprites/dsp_head_front_neutral.png",
      },
      threeQuarter: {
        chair: "assets/sprites/chair_side.png",
        body:  "assets/sprites/dsp_body_side.png",
        head:  "assets/sprites/dsp_head_34.png",
      },
      // True side-view head on the 3/4 body. Not used in the talking
      // animation by default; add { pose: "profile" } to turnSequence in
      // config.js to try it.
      profile: {
        chair: "assets/sprites/chair_side.png",
        body:  "assets/sprites/dsp_body_side.png",
        head:  "assets/sprites/dsp_head_side.png",
      },
    },
  },

  // OS-style window art. These pieces are cut from the artist's window
  // (art-source/ui/window_1.png). See js/ui-skin.js for how they're used.
  ui: {
    pixelScale: 3, // how many screen pixels per art pixel (2 on small screens)
    // Title bar of the main game window, in three pieces.
    titlebarLeft:   "assets/ui/titlebar_left.png",   // icon end, fixed width
    titlebarMiddle: "assets/ui/titlebar_middle.png", // 1px slice, stretched
    titlebarRight:  "assets/ui/titlebar_right.png",  // buttons end, fixed width
    // Border + background of the main window, below its title bar.
    windowBody:  { file: "assets/ui/window_body.png",  slice: [1, 12, 13, 3] },
    // Border + background of windows inside the game (no title bar).
    windowFrame: { file: "assets/ui/window_frame.png", slice: [3, 12, 13, 3] },
    // slice = [top, right, bottom, left]: how many art pixels on each side
    // belong to the border. The rest of the image stretches to fill.

    // The hoof cursor. "hotspot" is the pixel that does the clicking,
    // counted from the image's top-left corner (x across, y down).
    cursor: {
      scale: 1, // 1 = the art's own 32x32 size; 2 = twice as big
      normal:  { file: "assets/ui/piggycursorC1.png", hotspot: [2, 6] },
      pressed: { file: "assets/ui/piggycursorC2.png", hotspot: [1, 13] }, // while the mouse button is held
    },
  },

  // Bill's streaming room, shown in the stream window. Every layer is
  // 320x200 and lines up when stacked. Layers are drawn back to front;
  // { bill: true } marks where Bill goes in the stack.
  scene: {
    width: 320,
    height: 200,
    // Color shown around the scene if the window shape doesn't match it.
    edgeColor: "#2f3842",
    layers: [
      "assets/backgrounds/bg_layer1.png", // backdrop
      "assets/backgrounds/bg_layer2.png", // wall art and counter
      "assets/backgrounds/bg_layer3.png", // side table
      { bill: true },
      "assets/backgrounds/bg_layer4.png", // desk
      "assets/backgrounds/bg_layer5.png", // monitors
      "assets/backgrounds/bg_layer6.png", // mic arm and speakers
    ],
    // Where Bill's 64x64 frame sits, in scene pixels from the top-left corner.
    billPosition: { x: 128, y: 82 },
  },
};
