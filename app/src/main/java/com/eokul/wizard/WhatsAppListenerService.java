package com.eokul.wizard;

import android.app.Notification;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class WhatsAppListenerService extends NotificationListenerService {
    private static final String TAG = "WhatsAppListener";
    private static final String TRIGGER_PHRASE = "Merhaba, e-Okul Sihirbazını almak istiyorum";
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String packageName = sbn.getPackageName();
        if (!"com.whatsapp".equals(packageName) && !"com.whatsapp.w4b".equals(packageName)) {
            return;
        }

        Notification notification = sbn.getNotification();
        Bundle extras = notification.extras;
        String title = extras.getString(Notification.EXTRA_TITLE); // Genellikle gönderen adı
        CharSequence text = extras.getCharSequence(Notification.EXTRA_TEXT); // Mesaj içeriği

        if (title == null || text == null) return;

        String msg = text.toString();
        if (msg.contains(TRIGGER_PHRASE)) {
            Log.d(TAG, "Yeni eOS başvurusu yakalandı: " + title);
            saveOrder(title, msg);
        }
    }

    private void saveOrder(String sender, String msg) {
        executor.execute(() -> {
            AppDatabase db = AppDatabase.getDatabase(getApplicationContext());
            // Önce bu numaradan (veya isimden) kayıt var mı kontrol et
            Order existing = db.orderDao().getOrderByNumber(sender);
            if (existing == null) {
                Order order = new Order(sender, sender, msg);
                db.orderDao().insert(order);
                Log.d(TAG, "Veritabanına kaydedildi.");
            } else {
                Log.d(TAG, "Kayıt zaten var, atlanıyor.");
            }
        });
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        executor.shutdown();
    }
}
