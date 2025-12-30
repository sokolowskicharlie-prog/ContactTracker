/*
  # Add custom notification messages to goal notification settings

  1. Changes
    - Add `behind_schedule_message` column to `goal_notification_settings` table
      - Stores custom message for when user is behind schedule
      - Default: "⚠️ Behind Schedule"
    
    - Add `goal_achieved_message` column to `goal_notification_settings` table
      - Stores custom message for when goal is achieved
      - Default: "🎉 Goal Completed!"
    
    - Add `goal_missed_message` column to `goal_notification_settings` table
      - Stores custom message for when goal is missed
      - Default: "⏰ Time's Up!"
    
    - Add `motivational_messages` JSONB column to store custom motivational messages
      - Stores different message variations based on performance level
      - Default messages for high, medium, and low achievement

  2. Notes
    - Users can customize notification message text
    - Messages maintain professional tone by default
    - Can be personalized to user's preference
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goal_notification_settings' AND column_name = 'behind_schedule_message'
  ) THEN
    ALTER TABLE goal_notification_settings 
    ADD COLUMN behind_schedule_message text DEFAULT '⚠️ Behind Schedule';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goal_notification_settings' AND column_name = 'goal_achieved_message'
  ) THEN
    ALTER TABLE goal_notification_settings 
    ADD COLUMN goal_achieved_message text DEFAULT '🎉 Goal Completed!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goal_notification_settings' AND column_name = 'goal_missed_message'
  ) THEN
    ALTER TABLE goal_notification_settings 
    ADD COLUMN goal_missed_message text DEFAULT '⏰ Time''s Up!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goal_notification_settings' AND column_name = 'motivational_messages'
  ) THEN
    ALTER TABLE goal_notification_settings 
    ADD COLUMN motivational_messages jsonb DEFAULT '{
      "excellent": "Outstanding! You''re crushing it!",
      "good": "Great job! You hit your target!",
      "almost": "Almost there! Push a bit harder next time.",
      "halfWay": "Good effort, but you can do better!",
      "needsWork": "Time to step it up! You''ve got this!"
    }'::jsonb;
  END IF;
END $$;