# Ticket Watchlist

A powerful browser userscript for managing and tracking support tickets with comments, tags, and Markdown support.

## Features

- **Hotkey Management**: Use `Option+W` and `Option+Shift+W` to manage tickets
- **Persistent Storage**: Watchlist data is saved locally using localStorage
- **Markdown Support**: Write comments with Markdown syntax for rich formatting
- **Tag System**: Organize tickets with custom tags and filtering
- **Active/Done Workflow**: Move tickets between active and completed states
- **Auto-ticket Detection**: Automatically detects Zendesk ticket numbers from the page
- **Cross-platform Links**: Direct links to both Nirvana and Zendesk ticket systems

## Installation

### Prerequisites
- Chrome/Chromium-based browser
- OrangeMonkey or Tampermonkey extension

### Setup
1. Install [OrangeMonkey](https://chrome.google.com/webstore/detail/orangemonkey/bilboctdflbchcoelpnpffpgankeakjc) or [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
2. Click on the extension icon and select "Create a new script"
3. Copy and paste the contents of `watchlist.user.js`
4. Save the script (Ctrl+S or Cmd+S)
5. Navigate to any webpage and test with `Option+W`

## Usage

### Adding Tickets
- **Option+W**: Automatically detects ticket numbers from the page and adds them to your watchlist
- **Manual Selection**: Select text containing a ticket number, then press `Option+W`

### Managing Watchlist
- **Option+Shift+W**: Opens the watchlist modal to view and manage all tickets

### Comment Features
- **Markdown Support**: Use `**bold**`, `*italic*`, and `[text](url)` syntax
- **Double-click to Edit**: Double-click any row to enter edit mode
- **Auto-save**: Click outside the row or press Enter to save changes

### Tag System
- **Add Tags**: Enter comma-separated tags in the Tags column
- **Filter by Tags**: Use the Tags tab to filter tickets by selected tags
- **AND/OR Logic**: Toggle between matching any tag (OR) or all tags (AND)

### Ticket States
- **Active Tab**: View and manage current tickets
- **Done Tab**: View completed tickets
- **Move Between States**: Use checkmark (✓) to mark as done, cross (✕) to restore

## Hotkeys

| Combination | Action |
|-------------|---------|
| `Option+W` | Add ticket and open modal (highlights new ticket) |
| `Option+Shift+W` | Open watchlist modal |

## Markdown Syntax

| Syntax | Result |
|--------|---------|
| `**text**` | **Bold text** |
| `*text*` | *Italic text* |
| `[text](url)` | [Clickable link](url) |
| `https://example.com` | Auto-converted to clickable link |

## Data Storage

- **Active Tickets**: Stored in `ticket_watchlist` localStorage key
- **Done Tickets**: Stored in `ticket_watchlist_done` localStorage key
- **Tags**: Stored with each ticket as a comma-separated array
- **Comments**: Stored as Markdown text, rendered as HTML

## Browser Compatibility

- ✅ Chrome/Chromium (recommended)
- ✅ Edge (Chromium-based)
- ✅ Brave
- ✅ Opera
- ⚠️ Firefox (may require Greasemonkey)

## Extension Compatibility

- ✅ OrangeMonkey
- ✅ Tampermonkey
- ✅ Violentmonkey
- ⚠️ Greasemonkey (Firefox)

## Troubleshooting

### Script Not Loading
- Ensure the userscript manager extension is enabled
- Check browser console for any error messages
- Verify the script is saved and enabled in the extension

### Hotkeys Not Working
- Check if the script is enabled for the current site
- Ensure no other extensions are intercepting the key combinations
- Try refreshing the page after enabling the script

### Markdown Not Rendering
- Check browser console for any parsing errors
- Ensure Markdown syntax is correct (e.g., `[text](url)`)
- Verify the script has permission to modify page content

## Development

### File Structure
```
watchlist/
├── watchlist.user.js    # Main userscript file
├── README.md            # This file
└── .git/                # Git repository
```

### Version History
- **1.1.7**: Fixed Markdown rendering, removed external dependencies
- **1.1.6**: Added auto-ticket detection and Zendesk integration
- **1.1.5**: Enhanced UI and action button spacing
- **1.1.4**: Added tags system and filtering
- **1.1.3**: Improved edit mode and keyboard shortcuts
- **1.1.2**: Added Done/Active workflow
- **1.1.1**: Enhanced modal design and functionality
- **1.1.0**: Initial release with basic watchlist functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Open an issue on GitHub with detailed information

---

**Happy ticket watching!** 🎫👀
