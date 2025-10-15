package com.hatoms.tms.system;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

@WebMvcTest(SystemFlagsController.class)
@TestPropertySource(properties = "HATOMS_ENABLE_V0_UI=true")
class SystemFlagsControllerTest {

    @Autowired MockMvc mvc;

    @Value("${HATOMS_ENABLE_V0_UI:false}")
    boolean enabled;

    @Test
    void shouldExposeFlag() throws Exception {
        mvc.perform(MockMvcRequestBuilders.get("/api/system/flags").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.HATOMS_ENABLE_V0_UI", is(true)))
                .andExpect(jsonPath("$.version", is(1)));
    }
}
