package com.eokul.wizard;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.tabs.TabLayout;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ManagementActivity extends AppCompatActivity {

    private static final String TEMPLATE = "Uygulamanız Gönderilmiştir Güle Güle Kullanın, İlk kullanımda sorulacak aktivasyon kodu aşağıda verilmiştir.\n\n" +
        "Öncelikle zipli dosya içinde 3. sütuna öğrenci numarasını, 5. sütuna puanları girin Bu puanların ne olduğu önemli değil puanlar ne olursa olsun uygulama en yüksek puana en yüksek düzeyi en düşük puana en düşük düzeyi seçecektir. TEK BİR PUAN SÜTUNUNUN OLMASI TÜM DÜZEYLER İÇİN YETERLİDİR. E-OKUL YAZILI NOTLARINI DA GİREBİLİRSİNİZ. Excel dosyasını telefonunuza atınız.\n\n" +
        "Uygulama ile e-Okula girdikten sonra\n" +
        "1) Ekranın sağ altındaki sarı şimşeğe tıklayınız\n" +
        "2) Gelen panelde sınıf seçiniz.\n" +
        "3) Altta ders ismi gelecek, istediğiniz ders değilse değiştiriniz\n" +
        "4) Yukarıdaki gibi hazırladığınız Excel Dosyasını Dosya Seç tuşuna basarak seçiniz.\n" +
        "5) Tema kutusuna numarasını yazın. 1 birinci temayı yap 1-3 ise 1. 2. ve 3. temayı birden yap demektir\n" +
        "6) Tüm şubeleri bir seferde yapmak istiyorsanız alttaki kutucuğa tik atınız. \n" +
        "7) Tam otomatik işlem için kayıt Onayını otomatik seçin.\n" +
        "8) başlat tuşuna basın\n" +
        "9) Gerekirse duraklat\";

    private TabLayout tabLayout;
    private RecyclerView recyclerView;
    private TextView tvEmpty;
    private com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton fabSendSelected;
    private OrderAdapter adapter;
    private final List<Order> orderList = new ArrayList<>();
    private final List<Order> sendingQueue = new ArrayList<>();
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private String currentStatus = "eOS";
    private boolean isBatchSending = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_management);

        tabLayout = findViewById(R.id.tabLayout);
        recyclerView = findViewById(R.id.recyclerView);
        tvEmpty = findViewById(R.id.tvEmpty);
        fabSendSelected = findViewById(R.id.fabSendSelected);

        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new OrderAdapter();
        recyclerView.setAdapter(adapter);

        tabLayout.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            @Override
            public void onTabSelected(TabLayout.Tab tab) {
                currentStatus = (tab.getPosition() == 0) ? "eOS" : "FeOS";
                loadOrders();
            }

            @Override
            public void onTabUnselected(TabLayout.Tab tab) {
            }

            @Override
            public void onTabReselected(TabLayout.Tab tab) {
            }
        });

        fabSendSelected.setOnClickListener(v -> startBatchSending());

        loadOrders();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (isBatchSending && !sendingQueue.isEmpty()) {
            recyclerView.postDelayed(this::processNextInQueue, 1000);
        } else if (isBatchSending) {
            isBatchSending = false;
            Toast.makeText(this, "Tüm gönderimler tamamlandı!", Toast.LENGTH_LONG).show();
            loadOrders();
        }
    }

    private void loadOrders() {
        executor.execute(() -> {
            AppDatabase db = AppDatabase.getDatabase(this);
            List<Order> list = db.orderDao().getOrdersByStatus(currentStatus);
            runOnUiThread(() -> {
                orderList.clear();
                orderList.addAll(list);
                adapter.notifyDataSetChanged();
                updateFabVisibility();
                tvEmpty.setVisibility(orderList.isEmpty() ? View.VISIBLE : View.GONE);
            });
        });
    }

    private void updateFabVisibility() {
        if (!"eOS".equals(currentStatus)) {
            fabSendSelected.hide();
            return;
        }
        int selectedCount = 0;
        for (Order o : orderList)
            if (o.isSelected)
                selectedCount++;

        if (selectedCount > 0) {
            fabSendSelected.setText(selectedCount + " Kişiye Gönder");
            fabSendSelected.show();
        } else {
            fabSendSelected.hide();
        }
    }

    private void startBatchSending() {
        sendingQueue.clear();
        for (Order o : orderList) {
            if (o.isSelected)
                sendingQueue.add(o);
        }
        if (sendingQueue.isEmpty())
            return;

        isBatchSending = true;
        processNextInQueue();
    }

    private void processNextInQueue() {
        if (sendingQueue.isEmpty()) {
            isBatchSending = false;
            return;
        }

        Order next = sendingQueue.remove(0);
        sendPackage(next);
    }

    private void sendPackage(Order order) {
        if (order.activationCode == null || order.activationCode.isEmpty()) {
            order.activationCode = LicensingHelper.generateKey();
        }

        String fullMessage = TEMPLATE + "\n" + order.activationCode + "\n\nİşleminiz Tamamdır";

        File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        File zipFile = new File(downloadsDir, "eOS.zip");

        if (!zipFile.exists()) {
            Toast.makeText(this, "Hata: Downloads/eOS.zip bulunamadı!", Toast.LENGTH_LONG).show();
            isBatchSending = false;
            return;
        }

        Uri fileUri = FileProvider.getUriForFile(this, getPackageName() + ".provider", zipFile);

        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType("application/zip");
        intent.putExtra(Intent.EXTRA_STREAM, fileUri);
        intent.putExtra(Intent.EXTRA_TEXT, fullMessage);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.setPackage("com.whatsapp");

        try {
            startActivity(intent);

            executor.execute(() -> {
                order.status = "FeOS";
                order.isSelected = false;
                AppDatabase.getDatabase(this).orderDao().update(order);
            });

        } catch (Exception e) {
            Toast.makeText(this, "WhatsApp açılamadı!", Toast.LENGTH_SHORT).show();
            isBatchSending = false;
        }
    }

    private class OrderAdapter extends RecyclerView.Adapter<OrderAdapter.ViewHolder> {

        @NonNull
        @Override
        public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_order, parent, false);
            return new ViewHolder(v);
        }

        @Override
        public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
            Order order = orderList.get(position);
            holder.tvName.setText(order.senderName);
            holder.tvMessage.setText(order.message);

            SimpleDateFormat sdf = new SimpleDateFormat("dd/MM HH:mm", Locale.getDefault());
            holder.tvTime.setText(sdf.format(new Date(order.timestamp)));

            holder.cbSelect.setVisibility("eOS".equals(currentStatus) ? View.VISIBLE : View.GONE);
            holder.cbSelect.setChecked(order.isSelected);
            holder.cbSelect.setOnCheckedChangeListener((btn, isChecked) -> {
                order.isSelected = isChecked;
                updateFabVisibility();
            });

            if (order.activationCode != null) {
                holder.layoutCode.setVisibility(View.VISIBLE);
                holder.tvCode.setText(order.activationCode);
                holder.btnSend.setText("Tekrar Gönder");
            } else {
                holder.layoutCode.setVisibility(View.GONE);
                holder.btnSend.setText("Gönder");
            }

            holder.btnSend.setOnClickListener(v -> sendPackage(order));
        }

        @Override
        public int getItemCount() {
            return orderList.size();
        }

        class ViewHolder extends RecyclerView.ViewHolder {
            android.widget.CheckBox cbSelect;
            TextView tvName, tvTime, tvMessage, tvCode;
            View layoutCode;
            Button btnSend;

            ViewHolder(View itemView) {
                super(itemView);
                cbSelect = itemView.findViewById(R.id.cbSelect);
                tvName = itemView.findViewById(R.id.tvName);
                tvTime = itemView.findViewById(R.id.tvTime);
                tvMessage = itemView.findViewById(R.id.tvMessage);
                tvCode = itemView.findViewById(R.id.tvCode);
                layoutCode = itemView.findViewById(R.id.layoutCode);
                btnSend = itemView.findViewById(R.id.btnSend);
            }
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        executor.shutdown();
    }
}
