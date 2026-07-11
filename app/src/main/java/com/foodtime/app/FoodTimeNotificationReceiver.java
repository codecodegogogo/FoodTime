package com.foodtime.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class FoodTimeNotificationReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) {
            FoodTimeNotificationScheduler.restoreSchedules(context);
            return;
        }

        String action = intent.getAction();
        if (FoodTimeNotificationScheduler.ACTION_EMERGENCY.equals(action)) {
            FoodTimeNotificationScheduler.handleEmergency(context);
            return;
        }

        if (Intent.ACTION_BOOT_COMPLETED.equals(action)) {
            FoodTimeNotificationScheduler.restoreSchedules(context);
        }
    }
}
