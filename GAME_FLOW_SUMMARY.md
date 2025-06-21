# Symbol Game Flow - Fixed Implementation

## Overview

The game flow has been updated to match the expected API format where:

1. Games are selected from menu using `api/game/{id}` to fetch details
2. Game completion uses `api/game/complete` with the exact expected format

## Updated Game Flow

### 1. Game Selection (Menu → Play)

**File**: `symbol/app/game/menu.tsx`

- When user selects a game from the menu, the app now directly calls `api/game/{id}` to fetch game session details
- Removed the unnecessary `joinGame` API call
- Validates the response structure and shows detailed error messages

**Expected API Response**:

```json
{
  "message": "Game session retrieved successfully",
  "game_session": {
    "id": 21,
    "number_of_rounds": 1,
    "completed": false,
    "score": 100,
    "correct_answers": 1,
    "total_time": 180.5,
    "admin_instructions": null,
    "created_by_admin": true,
    "admin_creator": {
      "id": 1,
      "username": "johndoe",
      "full_name": "John Doe"
    }
  },
  "rounds": [
    {
      "id": 93,
      "round_number": 1,
      "first_number": 44,
      "second_number": 12,
      "user_symbol": ">",
      "response_time": 2.5,
      "is_correct": true
    }
  ],
  "progress": {
    "current_round_number": null,
    "completed_rounds": 1,
    "total_rounds": 1,
    "is_completed": false
  },
  "current_round": null
}
```

### 2. Game Session Loading

**File**: `symbol/app/game/play.tsx` - `loadGameSession()`

- Enhanced validation of the API response structure
- Better error handling for different error scenarios
- Shows admin instructions if available
- Validates rounds data before starting gameplay

### 3. Game Completion

**File**: `symbol/app/game/play.tsx` - `completeGame()`

- Updated to use the exact expected format for `api/game/complete`
- Removes individual round submissions during gameplay
- Submits all rounds data at once when game is completed

**Expected API Request Format**:

```json
{
  "game_session_id": 21,
  "difficulty_level": 2,
  "total_time": 180.5,
  "rounds": [
    {
      "first_number": 44,
      "second_number": 12,
      "user_symbol": ">",
      "response_time": 2.5
    }
  ],
  "recording_url": "https://example.com/recording.mp4"
}
```

### 4. API Service Updates

**File**: `symbol/services/api.js` - `completeGame()`

- Fixed to match the expected request format exactly
- Removed dual-mode logic (existing vs new session)
- All game completions now require `game_session_id`
- Validates required fields and formats data correctly

## Key Changes Made

1. **Simplified Game Selection**: Direct API call to fetch game details
2. **Unified Completion Format**: Single format for all game completions
3. **Enhanced Error Handling**: Better user feedback for various error states
4. **Removed Redundant Calls**: No more individual round submissions
5. **Validated Data Flow**: Proper validation at each step

## Game Modes Supported

1. **Regular Game**: Fetch from API → Play → Complete via API
2. **Practice Mode**: Offline gameplay with no API calls
3. **Quick Submit**: Generate offline → Submit all at once

## Error Handling

- **Game Not Found**: Clear message when game session doesn't exist
- **Invalid Session ID**: Fallback options provided
- **Completion Errors**: Retry mechanisms and clear error messages
- **Network Issues**: Graceful degradation with offline options

## Testing

The game flow now follows this exact sequence:

1. User selects game from menu
2. App calls `GET /api/game/{id}` to fetch game details
3. User plays through rounds (stored locally)
4. When complete, app calls `POST /api/game/complete` with all round data
5. Results are displayed from server response

This matches the expected API contract and ensures consistent behavior across all game sessions.
