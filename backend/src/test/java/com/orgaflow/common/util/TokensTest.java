package com.orgaflow.common.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TokensTest {

    @Test
    void hashesAreStableAndNotPlaintext() {
        String token = "refresh-token-value";
        String hash = Tokens.sha256(token);
        assertEquals(64, hash.length());
        assertNotEquals(token, hash);
        assertEquals(hash, Tokens.sha256(token));
    }

    @Test
    void randomTokensDiffer() {
        assertTrue(Tokens.randomUrlToken().length() >= 32);
        assertNotEquals(Tokens.randomUrlToken(), Tokens.randomUrlToken());
    }
}
