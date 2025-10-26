package com.quiz.quizsystem;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;

import static org.junit.jupiter.api.Assertions.assertFalse;

@SpringBootTest
class QuizsystemApplicationTests {

    @Autowired
    private DataSource dataSource;

    @Test
    void testDbConnection() throws Exception {
        try (Connection conn = dataSource.getConnection()) {
            assertFalse(conn.isClosed(), "Connection should be open");
            System.out.println("✅ Connected to DB: " + conn.getMetaData().getURL());
        }
    }
}
