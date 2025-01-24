import { HttpStatus, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit, page } = paginationDto;

    const totalPage = await this.product.count({where: {available: true}});
    const lastPage = Math.ceil(totalPage / limit);

    const producs = await this.product.findMany({
      where: {
        available: true,
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data: producs,
      metadata: {
        total: totalPage,
        lastPage: lastPage,
        page: page,
      }
    };
  }

  async findOne(id: number) {
    // console.log({id})
    const product = await this.product.findUnique({
      where: {
        id,
        available: true,
      }
    });

    if(!product) throw new RpcException({
      message: `Product with id ${id} not found`,
      status: HttpStatus.BAD_REQUEST
    });

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: _, ...data } = updateProductDto;
    await this.findOne(id);

    // return `This action updates a #${id} product`;
    const updatedProduct = await this.product.update({
      where: {
        id,
      },
      data: data,
    });

    return updatedProduct;
  }

  async remove(id: number) {
    await this.findOne(id);
    // const deletedProduct = await this.product.delete({
    //   where: {
    //     id,
    //   }
    // });
    const updatedProduct = await this.product.update({
      where: {
        id,
      },
      data: {
        available: false,
      }
    });
    return updatedProduct;
  }
}
