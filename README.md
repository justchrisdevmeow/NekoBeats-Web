# NekoBeats Web

🎵 Real-time audio visualizer for your browser.

Upload any audio track and watch reactive visuals powered by Web Audio API.

## Features

- **4 visualization modes**: Bars, Wave, Mirror, Circle
- **5 color modes**: Solid, Rainbow, Rainbow Multi, Gradient Bar, Gradient Global
- **4 effects**: Bloom, Fade, Particles, Space background
- **7 bar themes**: Default, Rounded, Thin, Hollow, Triangles, Dots, Space
- **Export/Import** theme settings
- **Drag progress bar** to seek
- **Loop** toggle
- **Fullscreen** support

## Controls

| Control | Description |
|---------|-------------|
| Upload track | Select audio file (MP3, WAV, OGG, etc.) |
| Bar count | Number of frequency bars (16–256) |
| Height scale | Amplitude multiplier |
| Sensitivity | Frequency response gain |
| Opacity | Bar transparency |
| Smoothing | FFT time smoothing |
| Rainbow speed | Hue rotation speed |
| Bloom intensity | Glow strength |
| Fade speed | Trail decay rate |
| Particle count | Max particles on screen |

## Keyboard Shortcuts

*(coming soon)*

## File Structure

```
NekoBeats-Web/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js        — init, audio, file upload
│   ├── visualizer.js  — draw loops, all modes
│   ├── effects.js     — bloom, fade, particles, space
│   ├── controls.js    — slider/button listeners
│   ├── themes.js      — theme export/import
│   └── barthemes.js   — bar theme presets + validation
└── barthemes/         — JSON exports for each preset
```

## Bar Theme Schema

Export a bar theme to see the full schema. Required field: `name`

Optional fields:
- `shape` - rect, rounded, line, hollow, triangle, dot, diamond
- `width_multiplier` - bar width scale
- `corner_radius` - for rounded shape
- `gap` - pixels between bars
- `bloom`, `fade`, `particles`, `space` - boolean toggles
- `color_mode` - override global color mode
- `rainbow_speed` - multiplier

## Browser Support

Requires Web Audio API. Works in:
- Chrome/Edge (desktop)
- Firefox
- Safari 14+

## License

MIT

## Author

justchrisdevmeow
