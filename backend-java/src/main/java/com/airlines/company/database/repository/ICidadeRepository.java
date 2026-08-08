package com.airlines.company.database.repository;

import com.airlines.company.database.model.Cidade;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ICidadeRepository extends JpaRepository<Cidade, Integer> {
}
