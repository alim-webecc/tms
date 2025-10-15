package com.hatoms.tms.system;

import java.time.OffsetDateTime;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system")
public class SystemFlagsController {

    /** Feature Flag kommt direkt aus ENV: HATOMS_ENABLE_V0_UI=true|false */
    @Value("${HATOMS_ENABLE_V0_UI:false}")
    private boolean enableV0Ui;

    @GetMapping("/flags")
    public Map<String, Object> flags() {
        return Map.of(
                "HATOMS_ENABLE_V0_UI", enableV0Ui,
                "timestamp", OffsetDateTime.now().toString(),
                "version", 1
        );
    }
}
