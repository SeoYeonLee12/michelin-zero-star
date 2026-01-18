package com.michelin0.michelinzerostar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@ConfigurationPropertiesScan
@SpringBootApplication
@EnableJpaAuditing
public class MichelinZeroStarApplication {

    public static void main(String[] args) {
        SpringApplication.run(MichelinZeroStarApplication.class, args);
    }

}
