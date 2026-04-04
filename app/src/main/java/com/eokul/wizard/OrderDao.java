package com.eokul.wizard;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Update;
import java.util.List;

@Dao
public interface OrderDao {
    @Insert
    void insert(Order order);

    @Update
    void update(Order order);

    @Query("SELECT * FROM orders WHERE status = :status ORDER BY timestamp DESC")
    List<Order> getOrdersByStatus(String status);

    @Query("SELECT * FROM orders WHERE senderNumber = :number LIMIT 1")
    Order getOrderByNumber(String number);
}
