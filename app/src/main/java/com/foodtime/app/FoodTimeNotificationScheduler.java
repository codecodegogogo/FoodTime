package com.foodtime.app;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

final class FoodTimeNotificationScheduler {
    static final String ACTION_EMERGENCY = "com.foodtime.app.action.EMERGENCY_REMINDER";
    static final String CHANNEL_ID = "foodtime_reminders";

    private static final String LEGACY_ACTION_DAILY = "com.foodtime.app.action.DAILY_REMINDER";
    private static final int[] LEGACY_DAILY_REQUESTS = {4101, 4103, 4104};
    private static final int EMERGENCY_REQUEST = 4102;
    private static final int EMERGENCY_NOTIFICATION_ID = 5102;
    private static final String PREFS = "foodtime.notifications";
    private static final String KEY_SETTINGS = "settings";
    private static final String KEY_PAYLOAD = "payload";
    private static final String KEY_NEXT_EMERGENCY_AT = "next_emergency_at";
    private static final String KEY_INTERVAL_MILLIS = "interval_millis";
    private static final long MINUTE = 60L * 1000L;
    private static final long HOUR = 60L * MINUTE;
    private static final long DAY = 24L * HOUR;

    private FoodTimeNotificationScheduler() {
    }

    static void savePlan(Context context, String settingsJson, String payloadJson) {
        SharedPreferences preferences = prefs(context);
        SharedPreferences.Editor editor = preferences.edit();
        if (settingsJson != null && !settingsJson.isEmpty()) {
            editor.putString(KEY_SETTINGS, settingsJson);
        }
        if (payloadJson != null && !payloadJson.isEmpty()) {
            editor.putString(KEY_PAYLOAD, payloadJson);
        }
        editor.commit();

        ensureChannel(context);
        cancelLegacyDailyAlarms(context);
        scheduleEmergency(context);
    }

    static void restoreSchedules(Context context) {
        ensureChannel(context);
        cancelLegacyDailyAlarms(context);
        scheduleEmergency(context);
    }

    static void handleEmergency(Context context) {
        ensureChannel(context);
        List<FoodItem> foods = emergencyFoods(context);
        if (foods.isEmpty()) {
            scheduleEmergency(context);
            return;
        }

        notify(context, EMERGENCY_NOTIFICATION_ID, expiringTitle(foods), expiringText(foods));
        NotificationSettings settings = settings(context);
        scheduleEmergencyAt(context, System.currentTimeMillis() + settings.intervalMillis(), settings.intervalMillis());
    }

    private static void scheduleEmergency(Context context) {
        NotificationSettings settings = settings(context);
        long now = System.currentTimeMillis();
        List<FoodItem> urgentFoods = emergencyFoods(context);
        if (urgentFoods.isEmpty()) {
            long nextEntryAt = nextEmergencyEntryAt(context, settings, now);
            if (nextEntryAt > 0L) {
                scheduleEmergencyAt(context, nextEntryAt, settings.intervalMillis());
            } else {
                cancelAlarm(context, ACTION_EMERGENCY, EMERGENCY_REQUEST);
                prefs(context).edit()
                        .remove(KEY_NEXT_EMERGENCY_AT)
                        .putLong(KEY_INTERVAL_MILLIS, settings.intervalMillis())
                        .commit();
            }
            return;
        }

        SharedPreferences preferences = prefs(context);
        long intervalMillis = settings.intervalMillis();
        long savedInterval = preferences.getLong(KEY_INTERVAL_MILLIS, 0L);
        long savedNextAt = preferences.getLong(KEY_NEXT_EMERGENCY_AT, 0L);
        if (savedInterval == intervalMillis && savedNextAt > now) {
            scheduleAlarm(context, ACTION_EMERGENCY, EMERGENCY_REQUEST, savedNextAt);
            return;
        }

        long triggerAt = savedInterval == 0L ? now + 1000L : now + intervalMillis;
        scheduleEmergencyAt(context, triggerAt, intervalMillis);
    }

    private static void scheduleEmergencyAt(Context context, long triggerAtMillis, long intervalMillis) {
        prefs(context).edit()
                .putLong(KEY_NEXT_EMERGENCY_AT, triggerAtMillis)
                .putLong(KEY_INTERVAL_MILLIS, intervalMillis)
                .commit();
        scheduleAlarm(context, ACTION_EMERGENCY, EMERGENCY_REQUEST, triggerAtMillis);
    }

    private static long nextEmergencyEntryAt(Context context, NotificationSettings settings, long now) {
        long next = Long.MAX_VALUE;
        for (FoodItem food : activeFoods(context)) {
            long entryAt = food.emergencyStartMillis(settings.emergencyDays);
            if (entryAt > now && entryAt < next) {
                next = entryAt;
            }
        }
        return next == Long.MAX_VALUE ? 0L : next;
    }

    private static void cancelLegacyDailyAlarms(Context context) {
        for (int requestCode : LEGACY_DAILY_REQUESTS) {
            cancelAlarm(context, LEGACY_ACTION_DAILY, requestCode);
        }
    }

    private static void scheduleAlarm(Context context, String action, int requestCode, long triggerAtMillis) {
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager == null) {
            return;
        }

        PendingIntent pendingIntent = alarmIntent(context, action, requestCode);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !manager.canScheduleExactAlarms()) {
            manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
        } else {
            manager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
        }
    }

    private static void cancelAlarm(Context context, String action, int requestCode) {
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager != null) {
            manager.cancel(alarmIntent(context, action, requestCode));
        }
    }

    private static PendingIntent alarmIntent(Context context, String action, int requestCode) {
        Intent intent = new Intent(context, FoodTimeNotificationReceiver.class);
        intent.setAction(action);
        return PendingIntent.getBroadcast(context, requestCode, intent, pendingFlags());
    }

    private static PendingIntent appIntent(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(context, 4201, intent, pendingFlags());
    }

    private static int pendingFlags() {
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return flags;
    }

    private static void notify(Context context, int id, String title, String text) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && ActivityCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) {
            return;
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(text))
                .setContentIntent(appIntent(context))
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH);
        manager.notify(id, builder.build());
    }

    private static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null || manager.getNotificationChannel(CHANNEL_ID) != null) {
            return;
        }

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "食物提醒",
                NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("FoodTime 紧急期限循环提醒");
        manager.createNotificationChannel(channel);
    }

    private static List<FoodItem> emergencyFoods(Context context) {
        NotificationSettings settings = settings(context);
        long now = System.currentTimeMillis();
        List<FoodItem> result = new ArrayList<>();
        for (FoodItem food : activeFoods(context)) {
            if (food.emergencyStartMillis(settings.emergencyDays) <= now) {
                result.add(food);
            }
        }
        return result;
    }

    private static List<FoodItem> activeFoods(Context context) {
        List<FoodItem> result = new ArrayList<>();
        try {
            String payload = prefs(context).getString(KEY_PAYLOAD, "{}");
            JSONArray foods = new JSONObject(payload).optJSONArray("foods");
            if (foods == null) {
                return result;
            }

            for (int index = 0; index < foods.length(); index++) {
                JSONObject item = foods.optJSONObject(index);
                if (item == null || !"active".equals(item.optString("status"))) {
                    continue;
                }
                FoodItem food = FoodItem.from(item);
                if (food != null) {
                    result.add(food);
                }
            }
        } catch (Exception ignored) {
        }
        return result;
    }

    private static NotificationSettings settings(Context context) {
        try {
            String raw = prefs(context).getString(KEY_SETTINGS, "{}");
            return NotificationSettings.from(new JSONObject(raw));
        } catch (Exception ignored) {
            return new NotificationSettings(3, 6d, "小时");
        }
    }

    private static String expiringTitle(List<FoodItem> foods) {
        String name = displayName(foods.get(0).name);
        return foods.size() > 1 ? name + "等食物需要处理" : name + "需要处理";
    }

    private static String expiringText(List<FoodItem> foods) {
        String name = displayName(foods.get(0).name);
        return foods.size() > 1 ? name + "等已进入紧急提醒范围，请尽快处理。" : name + "已进入紧急提醒范围，请尽快处理。";
    }

    private static String displayName(String value) {
        String name = value == null ? "" : value;
        if (name.codePointCount(0, name.length()) <= 5) {
            return name;
        }
        int endIndex = name.offsetByCodePoints(0, 5);
        return name.substring(0, endIndex) + "...";
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static final class NotificationSettings {
        final int emergencyDays;
        final double intervalValue;
        final String intervalUnit;

        NotificationSettings(int emergencyDays, double intervalValue, String intervalUnit) {
            this.emergencyDays = emergencyDays;
            this.intervalValue = intervalValue;
            this.intervalUnit = intervalUnit;
        }

        static NotificationSettings from(JSONObject json) {
            int emergencyDays = clamp(json.optInt("emergencyDays", 3), 1, 30);
            double intervalValue = clamp(json.optDouble("intervalValue", 6d), 1d, 9999d);
            String intervalUnit = normalizeUnit(json.optString("intervalUnit", "小时"));
            return new NotificationSettings(emergencyDays, intervalValue, intervalUnit);
        }

        long intervalMillis() {
            double minutes = intervalValue;
            if ("小时".equals(intervalUnit)) minutes *= 60d;
            if ("天".equals(intervalUnit)) minutes *= 24d * 60d;
            if ("星期".equals(intervalUnit)) minutes *= 7d * 24d * 60d;
            if ("月".equals(intervalUnit)) minutes *= 30d * 24d * 60d;
            return Math.max(MINUTE, Math.round(minutes * MINUTE));
        }
    }

    private static final class FoodItem {
        final String id;
        final String name;
        final String purchaseAt;
        final String purchaseDate;
        final double remindValue;
        final String remindUnit;
        final int remindDays;

        FoodItem(
                String id,
                String name,
                String purchaseAt,
                String purchaseDate,
                double remindValue,
                String remindUnit,
                int remindDays) {
            this.id = id;
            this.name = name;
            this.purchaseAt = purchaseAt;
            this.purchaseDate = purchaseDate;
            this.remindValue = remindValue;
            this.remindUnit = remindUnit;
            this.remindDays = remindDays;
        }

        static FoodItem from(JSONObject json) {
            String id = json.optString("id", "");
            String purchaseDate = json.optString("purchaseDate", "");
            if (id.isEmpty() || purchaseDate.isEmpty()) {
                return null;
            }
            return new FoodItem(
                    id,
                    json.optString("name", "食物"),
                    json.optString("purchaseAt", ""),
                    purchaseDate,
                    json.optDouble("remindValue", 0d),
                    normalizeUnit(json.optString("remindUnit", "天")),
                    Math.max(1, json.optInt("remindDays", 3)));
        }

        long emergencyStartMillis(int emergencyDays) {
            return dueAtMillis() - (emergencyDays * DAY);
        }

        private long dueAtMillis() {
            long purchasedAt = purchaseMillis();
            if (remindValue <= 0d) {
                return purchasedAt + (remindDays * DAY);
            }

            double minutes = remindValue;
            if ("小时".equals(remindUnit)) minutes *= 60d;
            if ("天".equals(remindUnit)) minutes *= 24d * 60d;
            if ("星期".equals(remindUnit)) minutes *= 7d * 24d * 60d;
            if ("月".equals(remindUnit)) minutes *= 30d * 24d * 60d;
            return purchasedAt + Math.round(minutes * MINUTE);
        }

        private long purchaseMillis() {
            Date parsed = parseDate(purchaseAt);
            if (parsed == null) {
                parsed = parseDate(purchaseDate);
            }
            return parsed == null ? System.currentTimeMillis() : parsed.getTime();
        }
    }

    private static Date parseDate(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        String input = value.trim();
        String[] patterns = {
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                "yyyy-MM-dd'T'HH:mm:ss'Z'",
                "yyyy-MM-dd'T'HH:mm:ss.SSS",
                "yyyy-MM-dd'T'HH:mm:ss",
                "yyyy-MM-dd"
        };
        for (String pattern : patterns) {
            try {
                SimpleDateFormat formatter = new SimpleDateFormat(pattern, Locale.US);
                formatter.setLenient(false);
                if (input.endsWith("Z")) {
                    formatter.setTimeZone(TimeZone.getTimeZone("UTC"));
                }
                Date parsed = formatter.parse(input);
                if (parsed != null) {
                    return parsed;
                }
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private static String normalizeUnit(String value) {
        if ("分钟".equals(value) || "小时".equals(value) || "天".equals(value)
                || "星期".equals(value) || "月".equals(value)) {
            return value;
        }
        return "小时";
    }

    private static int clamp(int value, int min, int max) {
        return Math.min(max, Math.max(min, value));
    }

    private static double clamp(double value, double min, double max) {
        return Math.min(max, Math.max(min, value));
    }
}
