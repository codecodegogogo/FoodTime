package com.foodtime.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.Manifest;
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
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

final class FoodTimeNotificationScheduler {
    static final String ACTION_DAILY = "com.foodtime.app.action.DAILY_REMINDER";
    static final String ACTION_EMERGENCY = "com.foodtime.app.action.EMERGENCY_REMINDER";
    static final String CHANNEL_ID = "foodtime_reminders";

    private static final String PREFS = "foodtime.notifications";
    private static final String KEY_SETTINGS = "settings";
    private static final String KEY_PAYLOAD = "payload";
    private static final String KEY_EMERGENCY_IDS = "emergency_ids";
    private static final String LEVEL_PREFIX = "level_";
    private static final String SIGNATURE_PREFIX = "signature_";
    private static final int DAILY_REQUEST = 4101;
    private static final int EMERGENCY_REQUEST = 4102;
    private static final long MINUTE = 60L * 1000L;
    private static final long DAY = 24L * 60L * 60L * 1000L;
    private static final int[] EMERGENCY_INTERVALS = {720, 360, 180, 90, 45, 30};

    private FoodTimeNotificationScheduler() {
    }

    static void savePlan(Context context, String settingsJson, String payloadJson) {
        SharedPreferences prefs = prefs(context);
        if (settingsJson != null && !settingsJson.isEmpty()) {
            prefs.edit().putString(KEY_SETTINGS, settingsJson).apply();
        }
        if (payloadJson != null && !payloadJson.isEmpty()) {
            prefs.edit().putString(KEY_PAYLOAD, payloadJson).apply();
        }

        ensureChannel(context);
        scheduleDaily(context);
        scheduleEmergency(context);
    }

    static void restoreSchedules(Context context) {
        ensureChannel(context);
        scheduleDaily(context);
        scheduleEmergency(context);
    }

    static void handleDaily(Context context) {
        ensureChannel(context);
        List<FoodItem> activeFoods = activeFoods(context);
        int urgentCount = 0;
        for (FoodItem food : activeFoods) {
            if (food.daysRemaining() <= food.emergencyDays(context)) {
                urgentCount++;
            }
        }

        String title = activeFoods.isEmpty() ? "FoodTime 今日提醒" : "FoodTime 今日食物提醒";
        String text = activeFoods.isEmpty()
                ? "今天没有正在储存的食物"
                : "当前储存 " + activeFoods.size() + " 件，紧急范围内 " + urgentCount + " 件";
        notify(context, 5101, title, text);
        scheduleDaily(context);
    }

    static void handleEmergency(Context context) {
        ensureChannel(context);
        List<FoodItem> foods = emergencyFoods(context);
        if (!foods.isEmpty()) {
            notify(context, 5102, "食物快到期了", emergencyText(foods));
            increaseEmergencyLevels(context, foods);
        }
        scheduleEmergency(context);
    }

    private static void scheduleDaily(Context context) {
        NotificationSettings settings = settings(context);
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.HOUR_OF_DAY, settings.dailyHour);
        calendar.set(Calendar.MINUTE, settings.dailyMinute);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        if (calendar.getTimeInMillis() <= System.currentTimeMillis()) {
            calendar.add(Calendar.DAY_OF_YEAR, 1);
        }

        scheduleAlarm(context, ACTION_DAILY, DAILY_REQUEST, calendar.getTimeInMillis());
    }

    private static void scheduleEmergency(Context context) {
        NotificationSettings settings = settings(context);
        List<FoodItem> foods = emergencyFoods(context);
        if (foods.isEmpty()) {
            long nextEntryAt = nextEmergencyEntryAt(context, settings);
            if (nextEntryAt > 0L) {
                scheduleAlarm(context, ACTION_EMERGENCY, EMERGENCY_REQUEST, nextEntryAt);
            } else {
                cancelAlarm(context, ACTION_EMERGENCY, EMERGENCY_REQUEST);
            }
            saveEmergencyIds(context, new HashSet<>());
            return;
        }

        SharedPreferences prefs = prefs(context);
        Set<String> ids = new HashSet<>();
        SharedPreferences.Editor editor = prefs.edit();
        int interval = EMERGENCY_INTERVALS[0];
        for (FoodItem food : foods) {
            ids.add(food.id);
            String signature = food.signature(settings.emergencyDays);
            String signatureKey = SIGNATURE_PREFIX + food.id;
            int level = prefs.getInt(LEVEL_PREFIX + food.id, 0);
            if (!signature.equals(prefs.getString(signatureKey, ""))) {
                level = 0;
                editor.putInt(LEVEL_PREFIX + food.id, 0);
                editor.putString(signatureKey, signature);
            }
            int candidate = intervalForLevel(level);
            interval = Math.min(interval, candidate);
        }
        editor.apply();
        saveEmergencyIds(context, ids);

        long triggerAt = System.currentTimeMillis() + (interval * MINUTE);
        scheduleAlarm(context, ACTION_EMERGENCY, EMERGENCY_REQUEST, triggerAt);
    }

    private static long nextEmergencyEntryAt(Context context, NotificationSettings settings) {
        long now = System.currentTimeMillis();
        long next = Long.MAX_VALUE;
        for (FoodItem food : activeFoods(context)) {
            long entryAt = food.emergencyStartMillis(settings.emergencyDays) + (EMERGENCY_INTERVALS[0] * MINUTE);
            if (entryAt > now && entryAt < next) {
                next = entryAt;
            }
        }
        return next == Long.MAX_VALUE ? 0L : next;
    }

    private static void scheduleAlarm(Context context, String action, int requestCode, long triggerAtMillis) {
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager == null) {
            return;
        }

        PendingIntent pendingIntent = alarmIntent(context, action, requestCode);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
        } else {
            manager.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
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
        channel.setDescription("FoodTime 每日提醒和紧急过期提醒");
        manager.createNotificationChannel(channel);
    }

    private static List<FoodItem> emergencyFoods(Context context) {
        NotificationSettings settings = settings(context);
        List<FoodItem> result = new ArrayList<>();
        for (FoodItem food : activeFoods(context)) {
            if (food.daysRemaining() <= settings.emergencyDays) {
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
            JSONObject json = new JSONObject(raw);
            return NotificationSettings.from(json);
        } catch (Exception ignored) {
            return new NotificationSettings(9, 0, 3);
        }
    }

    private static void increaseEmergencyLevels(Context context, List<FoodItem> foods) {
        SharedPreferences.Editor editor = prefs(context).edit();
        for (FoodItem food : foods) {
            int current = prefs(context).getInt(LEVEL_PREFIX + food.id, 0);
            editor.putInt(LEVEL_PREFIX + food.id, Math.min(current + 1, EMERGENCY_INTERVALS.length - 1));
        }
        editor.apply();
    }

    private static void saveEmergencyIds(Context context, Set<String> ids) {
        SharedPreferences.Editor editor = prefs(context).edit();
        Set<String> previous = prefs(context).getStringSet(KEY_EMERGENCY_IDS, new HashSet<>());
        for (String id : previous) {
            if (!ids.contains(id)) {
                editor.remove(LEVEL_PREFIX + id);
                editor.remove(SIGNATURE_PREFIX + id);
            }
        }
        editor.putStringSet(KEY_EMERGENCY_IDS, ids);
        editor.apply();
    }

    private static String emergencyText(List<FoodItem> foods) {
        StringBuilder builder = new StringBuilder();
        int limit = Math.min(foods.size(), 3);
        for (int index = 0; index < limit; index++) {
            if (index > 0) {
                builder.append("、");
            }
            builder.append(foods.get(index).name);
        }
        if (foods.size() > limit) {
            builder.append("等 ").append(foods.size()).append(" 件食物");
        }
        builder.append("已进入紧急提醒范围，请尽快处理。");
        return builder.toString();
    }

    private static int intervalForLevel(int level) {
        int index = Math.max(0, Math.min(level, EMERGENCY_INTERVALS.length - 1));
        return EMERGENCY_INTERVALS[index];
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static final class NotificationSettings {
        final int dailyHour;
        final int dailyMinute;
        final int emergencyDays;

        NotificationSettings(int dailyHour, int dailyMinute, int emergencyDays) {
            this.dailyHour = dailyHour;
            this.dailyMinute = dailyMinute;
            this.emergencyDays = emergencyDays;
        }

        static NotificationSettings from(JSONObject json) {
            String time = json.optString("dailyTime", "09:00");
            String[] parts = time.split(":");
            int hour = clamp(parts.length > 0 ? parseInt(parts[0], 9) : 9, 0, 23);
            int minute = clamp(parts.length > 1 ? parseInt(parts[1], 0) : 0, 0, 59);
            int emergencyDays = clamp(json.optInt("emergencyDays", 3), 1, 30);
            return new NotificationSettings(hour, minute, emergencyDays);
        }
    }

    private static final class FoodItem {
        final String id;
        final String name;
        final String purchaseDate;
        final int remindDays;
        final String updatedAt;

        FoodItem(String id, String name, String purchaseDate, int remindDays, String updatedAt) {
            this.id = id;
            this.name = name;
            this.purchaseDate = purchaseDate;
            this.remindDays = remindDays;
            this.updatedAt = updatedAt;
        }

        static FoodItem from(JSONObject json) {
            String id = json.optString("id", "");
            String name = json.optString("name", "食物");
            String purchaseDate = json.optString("purchaseDate", "");
            if (id.isEmpty() || purchaseDate.isEmpty()) {
                return null;
            }
            String updatedAt = json.optString("updatedAt", "");
            return new FoodItem(id, name, purchaseDate, Math.max(1, json.optInt("remindDays", 3)), updatedAt);
        }

        int emergencyDays(Context context) {
            return settings(context).emergencyDays;
        }

        int daysRemaining() {
            try {
                SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
                formatter.setLenient(false);
                Date purchasedAt = formatter.parse(purchaseDate);
                if (purchasedAt == null) {
                    return Integer.MAX_VALUE;
                }

                Calendar dueAt = Calendar.getInstance();
                dueAt.setTime(purchasedAt);
                dueAt.add(Calendar.DAY_OF_YEAR, remindDays);
                long diff = dueAt.getTimeInMillis() - startOfToday();
                return (int) Math.ceil(diff / (double) DAY);
            } catch (Exception ignored) {
                return Integer.MAX_VALUE;
            }
        }

        long emergencyStartMillis(int emergencyDays) {
            try {
                SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
                formatter.setLenient(false);
                Date purchasedAt = formatter.parse(purchaseDate);
                if (purchasedAt == null) {
                    return 0L;
                }

                Calendar startsAt = Calendar.getInstance();
                startsAt.setTime(purchasedAt);
                startsAt.add(Calendar.DAY_OF_YEAR, remindDays - emergencyDays);
                startsAt.set(Calendar.HOUR_OF_DAY, 0);
                startsAt.set(Calendar.MINUTE, 0);
                startsAt.set(Calendar.SECOND, 0);
                startsAt.set(Calendar.MILLISECOND, 0);
                return startsAt.getTimeInMillis();
            } catch (Exception ignored) {
                return 0L;
            }
        }

        String signature(int emergencyDays) {
            return purchaseDate + "|" + remindDays + "|" + updatedAt + "|" + emergencyDays;
        }
    }

    private static long startOfToday() {
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        return calendar.getTimeInMillis();
    }

    private static int parseInt(String value, int fallback) {
        try {
            return Integer.parseInt(value);
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private static int clamp(int value, int min, int max) {
        return Math.min(max, Math.max(min, value));
    }
}
