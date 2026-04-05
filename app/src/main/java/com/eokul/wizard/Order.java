package com.eokul.wizard;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "orders")
public class Order {
    @PrimaryKey(autoGenerate = true)
    public int id;
    
    public String senderName;
    public String senderNumber;
    public String message;
    public String status; // "eOS" or "FeOS"
    public String androidId;
    public String activationCode;
    public long timestamp;
    
    // UI selection state (not persisted in DB)
    @androidx.room.Ignore
    public boolean isSelected = false;

    public Order() {}

    public Order(String name, String number, String msg, String androidId) {
        this.senderName = name;
        this.senderNumber = number;
        this.message = msg;
        this.androidId = androidId;
        this.status = "eOS";
        this.timestamp = System.currentTimeMillis();
    }
}
