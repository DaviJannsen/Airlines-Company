package com.airlines.company.database.repository;

import com.airlines.company.database.model.Aeroporto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IAeroportoRepository extends JpaRepository<Aeroporto, String> {
}
