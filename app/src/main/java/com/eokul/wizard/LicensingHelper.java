package com.eokul.wizard;

import java.util.Random;

public class LicensingHelper {
    private static final String ALPHA = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final int SALT = 0x7A59;

    public static String generateKey() {
        StringBuilder b = new StringBuilder();
        Random r = new Random();
        for (int i = 0; i < 12; i++) {
            b.append(ALPHA.charAt(r.nextInt(ALPHA.length())));
        }
        String body = b.toString();
        String chk = calculateLicHash(body);
        String full = body + chk;
        
        // Format: XXXX-XXXX-XXXX-XXXX
        return full.substring(0, 4) + "-" + 
               full.substring(4, 8) + "-" + 
               full.substring(8, 12) + "-" + 
               full.substring(12, 16);
    }

    private static String calculateLicHash(String body) {
        long h = SALT;
        for (char c : body.toCharArray()) {
            h += (int) c;
            h = (h * 31) & 0xFFFFFF;
        }
        
        int[] shifts = {20, 15, 10, 5};
        StringBuilder res = new StringBuilder();
        for (int s : shifts) {
            res.append(ALPHA.charAt((int) ((h >> s) & 0x1F)));
        }
        return res.toString();
    }
}
